import pg from 'pg';
import { createLogger } from './logger.js';

const { Pool } = pg;
const logger = createLogger('db-client');

let pool = null;

/**
 * Get or create PostgreSQL connection pool
 * @returns {Pool}
 */
export function getDbPool() {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'parx',
    user: process.env.DB_USER || 'parx',
    password: process.env.DB_PASSWORD || 'parx',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected database error:', err);
  });

  pool.on('connect', () => {
    logger.info('Database pool connected');
  });

  return pool;
}

/**
 * Close database connection pool
 */
export async function closeDbPool() {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
    pool = null;
  }
}

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>}
 */
export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  
  logger.debug('Executed query', { text, duration, rows: res.rowCount });
  
  return res;
}
