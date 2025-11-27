import pg from 'pg';
import { createLogger } from '../../../../shared/utils/logger.js';

const { Pool } = pg;
const logger = createLogger('timescaledb-adapter');

export class TimescaleDBAdapter {
  constructor() {
    this.pool = null;
    this.batchQueue = [];
    this.batchSize = 1000;
    this.flushInterval = 1000; // 1 second
    this.flushTimer = null;
  }

  /**
   * Initialize TimescaleDB connection
   */
  async initialize() {
    this.pool = new Pool({
      host: process.env.TIMESCALE_HOST || 'localhost',
      port: process.env.TIMESCALE_PORT || 5433,
      database: process.env.TIMESCALE_DB || 'parx_timeseries',
      user: process.env.TIMESCALE_USER || 'parx',
      password: process.env.TIMESCALE_PASSWORD || 'parx',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('TimescaleDB pool error:', err);
    });

    // Test connection
    await this.pool.query('SELECT 1');
    
    this.startFlushTimer();
    logger.info('TimescaleDB adapter initialized');
  }

  /**
   * Write single data point
   */
  async write(channelId, value, quality, timestamp) {
    this.batchQueue.push({
      channelId,
      value,
      quality,
      timestamp: timestamp || Date.now()
    });

    if (this.batchQueue.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Write multiple data points
   */
  async writeBatch(dataPoints) {
    this.batchQueue.push(...dataPoints);

    if (this.batchQueue.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Flush batch queue to database
   */
  async flush() {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, this.batchSize);
    
    try {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');

        // Build bulk insert query
        const values = [];
        const params = [];
        let paramIndex = 1;

        for (const point of batch) {
          values.push(`(to_timestamp($${paramIndex}::double precision / 1000), $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
          params.push(point.timestamp, point.channelId, point.value, point.quality);
          paramIndex += 4;
        }

        const query = `
          INSERT INTO channel_data (time, channel_id, value, quality)
          VALUES ${values.join(', ')}
          ON CONFLICT DO NOTHING
        `;

        await client.query(query, params);
        await client.query('COMMIT');

        logger.debug(`Flushed ${batch.length} data points to TimescaleDB`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error flushing to TimescaleDB:', error);
      // Put failed batch back in queue
      this.batchQueue.unshift(...batch);
    }
  }

  /**
   * Query historical data
   */
  async query(channelId, startTime, endTime, limit = 1000) {
    try {
      const result = await this.pool.query(
        `SELECT 
          EXTRACT(EPOCH FROM time) * 1000 AS timestamp,
          value,
          quality
         FROM channel_data
         WHERE channel_id = $1
           AND time >= to_timestamp($2::double precision / 1000)
           AND time <= to_timestamp($3::double precision / 1000)
         ORDER BY time DESC
         LIMIT $4`,
        [channelId, startTime, endTime, limit]
      );

      return result.rows.map(row => ({
        timestamp: parseInt(row.timestamp),
        value: parseFloat(row.value),
        quality: row.quality
      }));
    } catch (error) {
      logger.error('Error querying TimescaleDB:', error);
      throw error;
    }
  }

  /**
   * Query aggregated data
   */
  async queryAggregated(channelId, startTime, endTime, interval = '1m') {
    try {
      const result = await this.pool.query(
        `SELECT 
          EXTRACT(EPOCH FROM bucket) * 1000 AS timestamp,
          avg_value,
          min_value,
          max_value,
          sample_count
         FROM channel_data_${interval}
         WHERE channel_id = $1
           AND bucket >= to_timestamp($2::double precision / 1000)
           AND bucket <= to_timestamp($3::double precision / 1000)
         ORDER BY bucket DESC`,
        [channelId, startTime, endTime]
      );

      return result.rows.map(row => ({
        timestamp: parseInt(row.timestamp),
        avg: parseFloat(row.avg_value),
        min: parseFloat(row.min_value),
        max: parseFloat(row.max_value),
        count: parseInt(row.sample_count)
      }));
    } catch (error) {
      logger.error('Error querying aggregated data:', error);
      throw error;
    }
  }

  /**
   * Write batch data
   */
  async writeBatchData(batchId, channelId, value, quality, timestamp) {
    try {
      await this.pool.query(
        `INSERT INTO batch_data (time, batch_id, channel_id, value, quality)
         VALUES (to_timestamp($1::double precision / 1000), $2, $3, $4, $5)`,
        [timestamp, batchId, channelId, value, quality]
      );
    } catch (error) {
      logger.error('Error writing batch data:', error);
      throw error;
    }
  }

  /**
   * Start periodic flush timer
   */
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.batchQueue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  /**
   * Stop flush timer
   */
  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Close connection
   */
  async close() {
    this.stopFlushTimer();
    await this.flush();
    await this.pool.end();
    logger.info('TimescaleDB adapter closed');
  }
}
