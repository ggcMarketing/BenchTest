import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../../../shared/utils/logger.js';

const logger = createLogger('buffer-manager');

/**
 * Disk-backed buffer for data persistence during network outages
 */
export class BufferManager {
  constructor(bufferDir = './data/buffer') {
    this.bufferDir = bufferDir;
    this.buffer = [];
    this.maxBufferSize = 10000; // Max items in memory
    this.flushInterval = 5000; // Flush to disk every 5 seconds
    this.flushTimer = null;
  }

  /**
   * Initialize buffer manager
   */
  async initialize() {
    try {
      await fs.mkdir(this.bufferDir, { recursive: true });
      await this.loadFromDisk();
      this.startFlushTimer();
      logger.info('Buffer manager initialized');
    } catch (error) {
      logger.error('Error initializing buffer manager:', error);
    }
  }

  /**
   * Add data to buffer
   */
  async add(data) {
    this.buffer.push({
      ...data,
      bufferedAt: Date.now()
    });

    // Flush to disk if buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      await this.flushToDisk();
    }
  }

  /**
   * Get buffered data
   */
  getBuffered(count = 100) {
    return this.buffer.splice(0, count);
  }

  /**
   * Get buffer size
   */
  size() {
    return this.buffer.length;
  }

  /**
   * Flush buffer to disk
   */
  async flushToDisk() {
    if (this.buffer.length === 0) return;

    try {
      const filename = `buffer-${Date.now()}.json`;
      const filepath = path.join(this.bufferDir, filename);
      
      await fs.writeFile(
        filepath,
        JSON.stringify(this.buffer, null, 2)
      );

      logger.info(`Buffer flushed to disk: ${this.buffer.length} items`);
      this.buffer = [];
    } catch (error) {
      logger.error('Error flushing buffer to disk:', error);
    }
  }

  /**
   * Load buffer from disk
   */
  async loadFromDisk() {
    try {
      const files = await fs.readdir(this.bufferDir);
      const bufferFiles = files.filter(f => f.startsWith('buffer-'));

      if (bufferFiles.length === 0) return;

      logger.info(`Loading ${bufferFiles.length} buffer file(s) from disk`);

      for (const file of bufferFiles) {
        const filepath = path.join(this.bufferDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const data = JSON.parse(content);
        
        this.buffer.push(...data);

        // Delete file after loading
        await fs.unlink(filepath);
      }

      logger.info(`Loaded ${this.buffer.length} buffered items from disk`);
    } catch (error) {
      logger.error('Error loading buffer from disk:', error);
    }
  }

  /**
   * Start periodic flush timer
   */
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flushToDisk();
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
   * Shutdown buffer manager
   */
  async shutdown() {
    this.stopFlushTimer();
    await this.flushToDisk();
    logger.info('Buffer manager shutdown complete');
  }
}
