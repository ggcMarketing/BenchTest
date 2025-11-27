import { createLogger } from '../../../shared/utils/logger.js';
import { getRedisClient } from '../../../shared/utils/redis-client.js';
import { TimescaleDBAdapter } from './adapters/timescaledb-adapter.js';
import { FileAdapter } from './adapters/file-adapter.js';
import { TriggerEngine } from './trigger-engine.js';

const logger = createLogger('storage-manager');

export class StorageManager {
  constructor() {
    this.adapters = {
      timescaledb: new TimescaleDBAdapter(),
      file: new FileAdapter()
    };
    this.triggerEngine = new TriggerEngine();
    this.redis = null;
    this.redisSubscriber = null;
    this.stats = {
      pointsReceived: 0,
      pointsStored: 0,
      errors: 0
    };
  }

  /**
   * Initialize storage manager
   */
  async initialize() {
    try {
      // Initialize adapters
      await this.adapters.timescaledb.initialize();
      await this.adapters.file.initialize();

      // Load storage rules
      await this.triggerEngine.loadRules();

      // Initialize Redis subscriber
      this.redis = await getRedisClient();
      this.redisSubscriber = this.redis.duplicate();
      await this.redisSubscriber.connect();

      // Subscribe to channel updates
      await this.redisSubscriber.subscribe('channel:updates', (message) => {
        this.handleChannelUpdate(message);
      });

      logger.info('Storage manager initialized');
    } catch (error) {
      logger.error('Error initializing storage manager:', error);
      throw error;
    }
  }

  /**
   * Handle channel update from collector
   */
  async handleChannelUpdate(message) {
    try {
      const data = JSON.parse(message);
      this.stats.pointsReceived++;

      // Get applicable storage rules
      const rules = this.triggerEngine.getRulesForChannel(data.channelId);

      for (const { ruleId, rule } of rules) {
        // Check if data should be stored
        if (this.triggerEngine.shouldStore(ruleId, data.channelId, data.value, data.timestamp)) {
          await this.storeData(rule, data);
          this.stats.pointsStored++;
        }
      }
    } catch (error) {
      logger.error('Error handling channel update:', error);
      this.stats.errors++;
    }
  }

  /**
   * Store data according to rule
   */
  async storeData(rule, data) {
    try {
      switch (rule.backend) {
        case 'timescaledb':
          await this.storeToTimescaleDB(rule, data);
          break;
        
        case 'file':
          await this.storeToFile(rule, data);
          break;
        
        case 'influxdb':
          logger.warn('InfluxDB backend not yet implemented');
          break;
        
        default:
          logger.warn(`Unknown backend: ${rule.backend}`);
      }
    } catch (error) {
      logger.error(`Error storing data for rule ${rule.id}:`, error);
      throw error;
    }
  }

  /**
   * Store data to TimescaleDB
   */
  async storeToTimescaleDB(rule, data) {
    await this.adapters.timescaledb.write(
      data.channelId,
      data.value,
      data.quality,
      data.timestamp
    );
    logger.debug(`Stored to TimescaleDB: ${data.channelId} = ${data.value}`);
  }

  /**
   * Store data to file
   */
  async storeToFile(rule, data) {
    const fileConfig = rule.config.file || {};
    
    // Get or create file writer
    let fileId = this.triggerEngine.getActiveFile(rule.id);
    
    if (!fileId) {
      // Create new file
      const timestamp = Date.now();
      const filename = this.generateFilename(fileConfig.naming, {
        timestamp,
        ruleId: rule.id
      });

      fileId = `${rule.id}_${timestamp}`;
      
      if (fileConfig.format === 'csv') {
        await this.adapters.file.createCSVWriter(fileId, filename, rule.channels);
        this.triggerEngine.startFileLogging(rule.id, fileId);
      }
    }

    // Write data
    const values = {};
    values[data.channelId] = data.value;

    await this.adapters.file.writeCSV(fileId, {
      timestamp: data.timestamp,
      values
    });

    logger.debug(`Stored to file: ${data.channelId} = ${data.value}`);
  }

  /**
   * Generate filename from template
   */
  generateFilename(template, vars) {
    if (!template) {
      return `data_${vars.timestamp}.csv`;
    }

    let filename = template;
    filename = filename.replace('{timestamp}', vars.timestamp);
    filename = filename.replace('{ruleId}', vars.ruleId);
    filename = filename.replace('{date}', new Date(vars.timestamp).toISOString().split('T')[0]);
    
    return filename;
  }

  /**
   * Reload storage rules
   */
  async reloadRules() {
    logger.info('Reloading storage rules...');
    await this.triggerEngine.loadRules();
    this.triggerEngine.clearCache();
  }

  /**
   * Get storage statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeRules: this.triggerEngine.rules.size,
      activeFiles: this.triggerEngine.activeFiles.size,
      queueSize: this.adapters.timescaledb.batchQueue.length
    };
  }

  /**
   * Query historical data
   */
  async queryHistorical(channelId, startTime, endTime, options = {}) {
    const backend = options.backend || 'timescaledb';
    
    if (backend === 'timescaledb') {
      if (options.aggregation) {
        return await this.adapters.timescaledb.queryAggregated(
          channelId,
          startTime,
          endTime,
          options.aggregation.interval
        );
      } else {
        return await this.adapters.timescaledb.query(
          channelId,
          startTime,
          endTime,
          options.limit
        );
      }
    }

    throw new Error(`Backend not supported for queries: ${backend}`);
  }

  /**
   * Shutdown storage manager
   */
  async shutdown() {
    logger.info('Shutting down storage manager...');

    // Unsubscribe from Redis
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit();
    }

    // Close adapters
    await this.adapters.timescaledb.close();
    await this.adapters.file.close();

    logger.info('Storage manager shutdown complete');
  }
}
