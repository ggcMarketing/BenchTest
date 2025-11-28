import { createLogger } from '../../../shared/utils/logger.js';
import { query } from '../../../shared/utils/db-client.js';
import { getRedisClient } from '../../../shared/utils/redis-client.js';
import { ModbusEngine } from './protocols/modbus.js';
import { OPCUAEngine } from './protocols/opcua.js';
import { MQTTEngine } from './protocols/mqtt.js';

const logger = createLogger('collector-manager');

export class CollectorManager {
  constructor() {
    this.engines = {
      modbus: new ModbusEngine(),
      opcua: new OPCUAEngine(),
      mqtt: new MQTTEngine()
    };
    
    this.activeChannels = new Map(); // Map<channelId, config>
    this.pollingIntervals = new Map(); // Map<channelId, intervalId>
    this.redis = null;
  }

  /**
   * Initialize collector
   */
  async initialize() {
    this.redis = await getRedisClient();
    await this.loadChannels();
    logger.info('Collector manager initialized');
  }

  /**
   * Load channels from database
   */
  async loadChannels() {
    try {
      const result = await query(
        'SELECT * FROM channels WHERE enabled = true ORDER BY name'
      );

      logger.info(`Loading ${result.rows.length} enabled channels`);

      for (const channel of result.rows) {
        await this.startChannel(channel);
      }
    } catch (error) {
      logger.error('Error loading channels:', error);
    }
  }

  /**
   * Start collecting data for a channel
   */
  async startChannel(channel) {
    try {
      const channelId = channel.id;
      const protocol = channel.protocol;
      const config = channel.config;

      this.activeChannels.set(channelId, channel);

      const engine = this.engines[protocol];
      if (!engine) {
        logger.warn(`Unsupported protocol: ${protocol} for channel ${channelId}`);
        return;
      }

      // Handle subscription-based protocols (OPC UA, MQTT)
      if (protocol === 'opcua' || protocol === 'mqtt') {
        await engine.subscribe(channelId, config, (data) => {
          this.publishData(data);
        });
      }
      // Handle polling-based protocols (Modbus)
      else if (protocol === 'modbus') {
        await engine.subscribe(channelId, config);
        this.startPolling(channelId, config.pollingInterval || 1000);
      }

      logger.info(`Channel started: ${channelId} (${protocol})`);
    } catch (error) {
      logger.error(`Error starting channel ${channel.id}:`, error);
    }
  }

  /**
   * Stop collecting data for a channel
   */
  async stopChannel(channelId) {
    try {
      const channel = this.activeChannels.get(channelId);
      if (!channel) return;

      const protocol = channel.protocol;
      const engine = this.engines[protocol];

      if (engine) {
        await engine.unsubscribe(channelId);
      }

      // Stop polling if active
      const intervalId = this.pollingIntervals.get(channelId);
      if (intervalId) {
        clearInterval(intervalId);
        this.pollingIntervals.delete(channelId);
      }

      this.activeChannels.delete(channelId);
      logger.info(`Channel stopped: ${channelId}`);
    } catch (error) {
      logger.error(`Error stopping channel ${channelId}:`, error);
    }
  }

  /**
   * Start polling for a channel
   */
  startPolling(channelId, interval) {
    const channel = this.activeChannels.get(channelId);
    if (!channel) return;

    const engine = this.engines[channel.protocol];
    if (!engine || !engine.readValue) return;

    const intervalId = setInterval(async () => {
      try {
        const data = await engine.readValue(channelId);
        this.publishData(data);
      } catch (error) {
        logger.error(`Polling error for ${channelId}:`, error);
      }
    }, interval);

    this.pollingIntervals.set(channelId, intervalId);
    logger.info(`Polling started for ${channelId}: ${interval}ms`);
  }

  /**
   * Publish data to Redis and Data Router
   */
  async publishData(data) {
    try {
      // Store in Redis cache
      await this.redis.setEx(
        `live:${data.channelId}`,
        60,
        JSON.stringify({
          value: data.value,
          quality: data.quality,
          timestamp: data.timestamp
        })
      );

      // Publish to Redis pub/sub for Data Router and Storage Engine
      await this.redis.publish(
        'data:raw',
        JSON.stringify(data)
      );

      // Update signal registry
      await this.redis.hSet(
        `signal:registry:${data.channelId}`,
        {
          lastValue: String(data.value),
          lastQuality: data.quality,
          lastUpdate: String(data.timestamp)
        }
      );

      logger.debug(`Data published: ${data.channelId} = ${data.value}`);
    } catch (error) {
      logger.error('Error publishing data:', error);
    }
  }

  /**
   * Reload channels from database
   */
  async reloadChannels() {
    logger.info('Reloading channels...');
    
    // Stop all current channels
    for (const channelId of this.activeChannels.keys()) {
      await this.stopChannel(channelId);
    }

    // Load fresh channels
    await this.loadChannels();
  }

  /**
   * Get channel status
   */
  getStatus() {
    return {
      activeChannels: this.activeChannels.size,
      pollingChannels: this.pollingIntervals.size,
      channels: Array.from(this.activeChannels.values()).map(ch => ({
        id: ch.id,
        name: ch.name,
        protocol: ch.protocol,
        enabled: ch.enabled
      }))
    };
  }

  /**
   * Shutdown collector
   */
  async shutdown() {
    logger.info('Shutting down collector...');

    // Stop all channels
    for (const channelId of this.activeChannels.keys()) {
      await this.stopChannel(channelId);
    }

    // Close all protocol engines
    for (const [protocol, engine] of Object.entries(this.engines)) {
      try {
        await engine.close();
        logger.info(`${protocol} engine closed`);
      } catch (error) {
        logger.error(`Error closing ${protocol} engine:`, error);
      }
    }

    logger.info('Collector shutdown complete');
  }
}
