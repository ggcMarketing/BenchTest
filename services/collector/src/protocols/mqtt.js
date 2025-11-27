import mqtt from 'mqtt';
import { createLogger } from '../../../../shared/utils/logger.js';

const logger = createLogger('mqtt-protocol');

export class MQTTEngine {
  constructor() {
    this.connections = new Map(); // Map<brokerUrl, client>
    this.subscriptions = new Map(); // Map<channelId, config>
    this.topicHandlers = new Map(); // Map<topic, Set<channelId>>
  }

  /**
   * Get or create MQTT connection
   */
  async getConnection(brokerUrl, options = {}) {
    if (this.connections.has(brokerUrl)) {
      return this.connections.get(brokerUrl);
    }

    return new Promise((resolve, reject) => {
      const client = mqtt.connect(brokerUrl, {
        clientId: options.clientId || `parx-collector-${Date.now()}`,
        username: options.username,
        password: options.password,
        clean: true,
        reconnectPeriod: 5000,
        connectTimeout: 30000
      });

      client.on('connect', () => {
        this.connections.set(brokerUrl, client);
        logger.info(`MQTT connection established: ${brokerUrl}`);
        resolve(client);
      });

      client.on('error', (error) => {
        logger.error(`MQTT connection error: ${brokerUrl}`, error);
        reject(error);
      });

      client.on('offline', () => {
        logger.warn(`MQTT client offline: ${brokerUrl}`);
      });

      client.on('reconnect', () => {
        logger.info(`MQTT client reconnecting: ${brokerUrl}`);
      });
    });
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channelId, config, onDataChange) {
    this.subscriptions.set(channelId, config);

    try {
      const client = await this.getConnection(config.brokerUrl, config.options);

      // Subscribe to topic
      client.subscribe(config.topic, { qos: config.qos || 0 }, (err) => {
        if (err) {
          logger.error(`MQTT subscription failed for ${channelId}:`, err);
          throw err;
        }
      });

      // Track topic handler
      if (!this.topicHandlers.has(config.topic)) {
        this.topicHandlers.set(config.topic, new Set());
      }
      this.topicHandlers.get(config.topic).add(channelId);

      // Set up message handler
      client.on('message', (topic, message) => {
        if (topic === config.topic) {
          try {
            const value = this.parseMessage(message, config.format);
            
            if (onDataChange) {
              onDataChange({
                channelId,
                value,
                quality: 'GOOD',
                timestamp: Date.now()
              });
            }
          } catch (error) {
            logger.error(`Error parsing MQTT message for ${channelId}:`, error);
          }
        }
      });

      logger.info(`MQTT channel subscribed: ${channelId} to ${config.topic}`);
    } catch (error) {
      logger.error(`MQTT subscription failed for ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe from a channel
   */
  async unsubscribe(channelId) {
    const config = this.subscriptions.get(channelId);
    if (!config) return;

    try {
      const client = this.connections.get(config.brokerUrl);
      if (client) {
        // Remove from topic handlers
        const handlers = this.topicHandlers.get(config.topic);
        if (handlers) {
          handlers.delete(channelId);
          
          // Unsubscribe from topic if no more handlers
          if (handlers.size === 0) {
            client.unsubscribe(config.topic);
            this.topicHandlers.delete(config.topic);
          }
        }
      }

      this.subscriptions.delete(channelId);
      logger.info(`MQTT channel unsubscribed: ${channelId}`);
    } catch (error) {
      logger.error(`MQTT unsubscribe error for ${channelId}:`, error);
    }
  }

  /**
   * Parse MQTT message
   */
  parseMessage(message, format = 'json') {
    const messageStr = message.toString();

    switch (format) {
      case 'json':
        try {
          const data = JSON.parse(messageStr);
          return data.value !== undefined ? data.value : data;
        } catch {
          return messageStr;
        }
      case 'number':
        return parseFloat(messageStr);
      case 'boolean':
        return messageStr.toLowerCase() === 'true' || messageStr === '1';
      case 'string':
      default:
        return messageStr;
    }
  }

  /**
   * Publish value to MQTT topic
   */
  async publishValue(channelId, value) {
    const config = this.subscriptions.get(channelId);
    if (!config) {
      throw new Error(`Channel not subscribed: ${channelId}`);
    }

    try {
      const client = await this.getConnection(config.brokerUrl, config.options);

      const message = config.format === 'json' 
        ? JSON.stringify({ value, timestamp: Date.now() })
        : String(value);

      client.publish(config.topic, message, { qos: config.qos || 0 }, (err) => {
        if (err) {
          logger.error(`MQTT publish error for ${channelId}:`, err);
          throw err;
        }
        logger.info(`MQTT publish successful: ${channelId} = ${value}`);
      });

      return true;
    } catch (error) {
      logger.error(`MQTT publish error for ${channelId}:`, error.message);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  async close() {
    for (const [brokerUrl, client] of this.connections) {
      try {
        client.end(true);
        logger.info(`MQTT connection closed: ${brokerUrl}`);
      } catch (error) {
        logger.error(`Error closing MQTT connection ${brokerUrl}:`, error);
      }
    }
    this.connections.clear();
    this.subscriptions.clear();
    this.topicHandlers.clear();
  }
}
