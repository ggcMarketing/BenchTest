import express from 'express';
import Joi from 'joi';
import { query } from '../../../../shared/utils/db-client.js';
import { createLogger } from '../../../../shared/utils/logger.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const logger = createLogger('storage-rules-routes');

// Validation schema
const storageRuleSchema = Joi.object({
  id: Joi.string().max(50),
  name: Joi.string().max(100).required(),
  enabled: Joi.boolean().default(true),
  backend: Joi.string().valid('timescaledb', 'influxdb', 'file').required(),
  mode: Joi.string().valid('continuous', 'change', 'event', 'trigger').required(),
  channels: Joi.array().items(Joi.string()).min(1).required(),
  config: Joi.object().required()
});

/**
 * GET /api/v1/storage/rules
 * List all storage rules
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM storage_rules ORDER BY name'
    );

    res.json({
      rules: result.rows.map(row => ({
        ...row,
        config: row.config
      }))
    });
  } catch (error) {
    logger.error('Error listing storage rules:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/storage/rules/:id
 * Get storage rule by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM storage_rules WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Storage rule not found'
        }
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error getting storage rule:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/storage/rules
 * Create new storage rule
 */
router.post('/', authenticateToken, requireRole('admin', 'engineer'), async (req, res) => {
  try {
    const { error, value } = storageRuleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: error.details[0].message
        }
      });
    }

    const id = value.id || `rule-${Date.now()}`;

    const existing = await query('SELECT id FROM storage_rules WHERE id = $1', [id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Storage rule ID already exists'
        }
      });
    }

    const result = await query(
      `INSERT INTO storage_rules (id, name, enabled, backend, mode, channels, config, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, value.name, value.enabled, value.backend, value.mode, value.channels,
       JSON.stringify(value.config), req.user.id]
    );

    logger.info(`Storage rule created: ${id} by ${req.user.username}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating storage rule:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * PUT /api/v1/storage/rules/:id
 * Update storage rule
 */
router.put('/:id', authenticateToken, requireRole('admin', 'engineer'), async (req, res) => {
  try {
    const { error, value } = storageRuleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: error.details[0].message
        }
      });
    }

    const existing = await query('SELECT id FROM storage_rules WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Storage rule not found'
        }
      });
    }

    const result = await query(
      `UPDATE storage_rules 
       SET name = $1, enabled = $2, backend = $3, mode = $4, channels = $5, config = $6
       WHERE id = $7
       RETURNING *`,
      [value.name, value.enabled, value.backend, value.mode, value.channels,
       JSON.stringify(value.config), req.params.id]
    );

    logger.info(`Storage rule updated: ${req.params.id} by ${req.user.username}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating storage rule:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * DELETE /api/v1/storage/rules/:id
 * Delete storage rule
 */
router.delete('/:id', authenticateToken, requireRole('admin', 'engineer'), async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM storage_rules WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Storage rule not found'
        }
      });
    }

    logger.info(`Storage rule deleted: ${req.params.id} by ${req.user.username}`);

    res.json({ message: 'Storage rule deleted successfully' });
  } catch (error) {
    logger.error('Error deleting storage rule:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

export default router;
