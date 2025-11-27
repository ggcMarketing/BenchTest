import { OPCUAClient, AttributeIds, DataType } from 'node-opcua';
import { createLogger } from '../../../../shared/utils/logger.js';

const logger = createLogger('opcua-protocol');

export class OPCUAEngine {
  constructor() {
    this.connections = new Map(); // Map<endpoint, {client, session}>
    this.subscriptions = new Map(); // Map<channelId, config>
    this.monitoredItems = new Map(); // Map<channelId, monitoredItem>
  }

  /**
   * Get or create OPC UA connection
   */
  async getConnection(endpoint) {
    if (this.connections.has(endpoint)) {
      return this.connections.get(endpoint);
    }

    try {
      const client = OPCUAClient.create({
        endpointMustExist: false,
        connectionStrategy: {
          maxRetry: 3,
          initialDelay: 1000,
          maxDelay: 10000
        }
      });

      await client.connect(endpoint);
      const session = await client.createSession();

      const connection = { client, session };
      this.connections.set(endpoint, connection);

      logger.info(`OPC UA connection established: ${endpoint}`);
      return connection;
    } catch (error) {
      logger.error(`OPC UA connection failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channelId, config, onDataChange) {
    this.subscriptions.set(channelId, config);

    try {
      const { session } = await this.getConnection(config.endpoint);

      // Create subscription if needed
      const subscription = await session.createSubscription2({
        requestedPublishingInterval: config.publishingInterval || 1000,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 100,
        publishingEnabled: true,
        priority: 10
      });

      // Monitor the node
      const itemToMonitor = {
        nodeId: config.nodeId,
        attributeId: AttributeIds.Value
      };

      const monitoredItem = await subscription.monitor(
        itemToMonitor,
        {
          samplingInterval: config.samplingInterval || 1000,
          discardOldest: true,
          queueSize: 10
        },
        DataType.Variant
      );

      monitoredItem.on('changed', (dataValue) => {
        const value = this.extractValue(dataValue);
        const quality = dataValue.statusCode.isGood() ? 'GOOD' : 'BAD';

        if (onDataChange) {
          onDataChange({
            channelId,
            value,
            quality,
            timestamp: Date.now()
          });
        }
      });

      this.monitoredItems.set(channelId, monitoredItem);
      logger.info(`OPC UA channel subscribed: ${channelId}`);
    } catch (error) {
      logger.error(`OPC UA subscription failed for ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelId) {
    const monitoredItem = this.monitoredItems.get(channelId);
    if (monitoredItem) {
      await monitoredItem.terminate();
      this.monitoredItems.delete(channelId);
    }
    this.subscriptions.delete(channelId);
    logger.info(`OPC UA channel unsubscribed: ${channelId}`);
  }

  /**
   * Read value from OPC UA server
   */
  async readValue(channelId) {
    const config = this.subscriptions.get(channelId);
    if (!config) {
      throw new Error(`Channel not subscribed: ${channelId}`);
    }

    try {
      const { session } = await this.getConnection(config.endpoint);

      const dataValue = await session.read({
        nodeId: config.nodeId,
        attributeId: AttributeIds.Value
      });

      const value = this.extractValue(dataValue);
      const quality = dataValue.statusCode.isGood() ? 'GOOD' : 'BAD';

      return {
        channelId,
        value,
        quality,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`OPC UA read error for ${channelId}:`, error.message);
      return {
        channelId,
        value: null,
        quality: 'BAD',
        timestamp: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Extract value from OPC UA DataValue
   */
  extractValue(dataValue) {
    if (!dataValue.value || dataValue.value.value === null) {
      return null;
    }
    return dataValue.value.value;
  }

  /**
   * Write value to OPC UA server
   */
  async writeValue(channelId, value) {
    const config = this.subscriptions.get(channelId);
    if (!config) {
      throw new Error(`Channel not subscribed: ${channelId}`);
    }

    try {
      const { session } = await this.getConnection(config.endpoint);

      const statusCode = await session.write({
        nodeId: config.nodeId,
        attributeId: AttributeIds.Value,
        value: {
          value: {
            dataType: this.getDataType(config.dataType),
            value: value
          }
        }
      });

      if (statusCode.isGood()) {
        logger.info(`OPC UA write successful: ${channelId} = ${value}`);
        return true;
      } else {
        throw new Error(`Write failed: ${statusCode.toString()}`);
      }
    } catch (error) {
      logger.error(`OPC UA write error for ${channelId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get OPC UA data type
   */
  getDataType(type) {
    const typeMap = {
      'boolean': DataType.Boolean,
      'int16': DataType.Int16,
      'uint16': DataType.UInt16,
      'int32': DataType.Int32,
      'uint32': DataType.UInt32,
      'float': DataType.Float,
      'double': DataType.Double,
      'string': DataType.String
    };
    return typeMap[type] || DataType.Variant;
  }

  /**
   * Close all connections
   */
  async close() {
    // Terminate all monitored items
    for (const [channelId, monitoredItem] of this.monitoredItems) {
      try {
        await monitoredItem.terminate();
      } catch (error) {
        logger.error(`Error terminating monitored item ${channelId}:`, error);
      }
    }

    // Close all sessions and connections
    for (const [endpoint, { session, client }] of this.connections) {
      try {
        await session.close();
        await client.disconnect();
        logger.info(`OPC UA connection closed: ${endpoint}`);
      } catch (error) {
        logger.error(`Error closing OPC UA connection ${endpoint}:`, error);
      }
    }

    this.connections.clear();
    this.subscriptions.clear();
    this.monitoredItems.clear();
  }
}
