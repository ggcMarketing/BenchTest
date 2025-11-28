import express from 'express';
import { query } from '../../../../shared/utils/db-client.js';
import { createLogger } from '../../../../shared/utils/logger.js';

const router = express.Router();
const logger = createLogger('connections-routes');

/**
 * GET /api/v1/io/connections
 * Get all connections (optionally filtered by interface_id)
 */
router.get('/', async (req, res) => {
  try {
    const { interface_id } = req.query;

    let sql = 'SELECT * FROM connections';
    let params = [];

    if (interface_id) {
      sql += ' WHERE interface_id = $1';
      params.push(interface_id);
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    res.json({
      connections: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching connections:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/io/connections/:id
 * Get connection by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM connections WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Connection not found'
        }
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching connection:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/io/connections
 * Create new connection
 */
router.post('/', async (req, res) => {
  try {
    const { id, interface_id, name, description, enabled, config, metadata } = req.body;

    const result = await query(
      `INSERT INTO connections (id, interface_id, name, description, enabled, config, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, interface_id, name, description || null, enabled !== false, config || {}, metadata || {}]
    );

    logger.info(`Connection created: ${id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating connection:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * PUT /api/v1/io/connections/:id
 * Update connection
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, enabled, config, metadata } = req.body;

    const result = await query(
      `UPDATE connections
       SET name = $1, description = $2, enabled = $3, config = $4, metadata = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, description, enabled, config, metadata, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Connection not found'
        }
      });
    }

    logger.info(`Connection updated: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating connection:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * DELETE /api/v1/io/connections/:id
 * Delete connection (cascades to channels)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM connections WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Connection not found'
        }
      });
    }

    logger.info(`Connection deleted: ${id}`);
    res.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    logger.error('Error deleting connection:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

export default router;
