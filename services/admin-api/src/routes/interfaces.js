import express from 'express';
import { query } from '../../../../shared/utils/db-client.js';
import { createLogger } from '../../../../shared/utils/logger.js';

const router = express.Router();
const logger = createLogger('interfaces-routes');

/**
 * GET /api/v1/io/interfaces
 * Get all interfaces
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM interfaces ORDER BY created_at DESC'
    );

    res.json({
      interfaces: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching interfaces:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/io/interfaces/:id
 * Get interface by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM interfaces WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Interface not found'
        }
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching interface:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/io/interfaces
 * Create new interface
 */
router.post('/', async (req, res) => {
  try {
    const { id, name, protocol, description, enabled, config } = req.body;

    const result = await query(
      `INSERT INTO interfaces (id, name, protocol, description, enabled, config)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, name, protocol, description || null, enabled !== false, config || {}]
    );

    logger.info(`Interface created: ${id}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating interface:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * PUT /api/v1/io/interfaces/:id
 * Update interface
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, protocol, description, enabled, config } = req.body;

    const result = await query(
      `UPDATE interfaces
       SET name = $1, protocol = $2, description = $3, enabled = $4, config = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, protocol, description, enabled, config, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Interface not found'
        }
      });
    }

    logger.info(`Interface updated: ${id}`);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating interface:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * DELETE /api/v1/io/interfaces/:id
 * Delete interface (cascades to connections and channels)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM interfaces WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Interface not found'
        }
      });
    }

    logger.info(`Interface deleted: ${id}`);
    res.json({ message: 'Interface deleted successfully' });
  } catch (error) {
    logger.error('Error deleting interface:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

export default router;
