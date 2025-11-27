import fs from 'fs/promises';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { createLogger } from '../../../../shared/utils/logger.js';

const logger = createLogger('file-adapter');

export class FileAdapter {
  constructor(basePath = './data/files') {
    this.basePath = basePath;
    this.activeWriters = new Map(); // Map<fileId, {writer, rowCount}>
    this.maxRowsPerFile = 100000;
  }

  /**
   * Initialize file adapter
   */
  async initialize() {
    await fs.mkdir(this.basePath, { recursive: true });
    logger.info('File adapter initialized');
  }

  /**
   * Create CSV file writer
   */
  async createCSVWriter(fileId, filename, channels) {
    const filepath = path.join(this.basePath, filename);

    const headers = [
      { id: 'timestamp', title: 'Timestamp' },
      { id: 'datetime', title: 'DateTime' },
      ...channels.map(ch => ({ id: ch, title: ch }))
    ];

    const writer = createObjectCsvWriter({
      path: filepath,
      header: headers,
      append: false
    });

    this.activeWriters.set(fileId, {
      writer,
      filepath,
      channels,
      rowCount: 0,
      startTime: Date.now()
    });

    logger.info(`CSV writer created: ${filename}`);
    return fileId;
  }

  /**
   * Write data to CSV file
   */
  async writeCSV(fileId, data) {
    const writerInfo = this.activeWriters.get(fileId);
    if (!writerInfo) {
      throw new Error(`File writer not found: ${fileId}`);
    }

    try {
      // Format data for CSV
      const record = {
        timestamp: data.timestamp,
        datetime: new Date(data.timestamp).toISOString()
      };

      // Add channel values
      for (const ch of writerInfo.channels) {
        record[ch] = data.values[ch] !== undefined ? data.values[ch] : '';
      }

      await writerInfo.writer.writeRecords([record]);
      writerInfo.rowCount++;

      // Check if rotation is needed
      if (writerInfo.rowCount >= this.maxRowsPerFile) {
        await this.rotateFile(fileId);
      }
    } catch (error) {
      logger.error(`Error writing to CSV ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Rotate file (create new file when size limit reached)
   */
  async rotateFile(fileId) {
    const writerInfo = this.activeWriters.get(fileId);
    if (!writerInfo) return;

    logger.info(`Rotating file: ${fileId} (${writerInfo.rowCount} rows)`);

    // Close current writer
    this.activeWriters.delete(fileId);

    // Create new file with timestamp suffix
    const timestamp = Date.now();
    const newFilename = `${fileId}_${timestamp}.csv`;
    await this.createCSVWriter(fileId, newFilename, writerInfo.channels);
  }

  /**
   * Create Parquet file writer
   */
  async createParquetWriter(fileId, filename, schema) {
    // TODO: Implement Parquet writer using parquetjs
    logger.warn('Parquet writer not yet implemented');
    throw new Error('Parquet format not yet supported');
  }

  /**
   * Close file writer
   */
  async closeWriter(fileId) {
    const writerInfo = this.activeWriters.get(fileId);
    if (!writerInfo) return;

    this.activeWriters.delete(fileId);
    logger.info(`File writer closed: ${fileId} (${writerInfo.rowCount} rows)`);
  }

  /**
   * Close all writers
   */
  async close() {
    for (const fileId of this.activeWriters.keys()) {
      await this.closeWriter(fileId);
    }
    logger.info('File adapter closed');
  }

  /**
   * Get file info
   */
  async getFileInfo(filename) {
    const filepath = path.join(this.basePath, filename);
    try {
      const stats = await fs.stat(filepath);
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * List files
   */
  async listFiles(pattern = '*') {
    try {
      const files = await fs.readdir(this.basePath);
      const fileInfos = [];

      for (const file of files) {
        const info = await this.getFileInfo(file);
        if (info) {
          fileInfos.push(info);
        }
      }

      return fileInfos;
    } catch (error) {
      logger.error('Error listing files:', error);
      return [];
    }
  }
}
