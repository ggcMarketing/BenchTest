import express from 'express';
import Joi from 'joi';
import { query } from '../../../../shared/utils/db-client.js';
import { createLogger } from '../../../../shared/utils/logger.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();
const logger = createLogger('channels-routes');

// Validation schemas
const channelSchema = Joi.object({
  id: Joi.string().max(50),
  name: Joi.string().max(100).required(),
  protocol: Joi.string().valid('modbus', 'ethernet-ip', 'opcua', 'mqtt', 'egd').required(),
  enabled: Joi.boolean().default(true),
  config: Joi.object().required(),
  metadata: Joi.object().optional()
});

/**
 * GET /api/v1/io/channels
 * List all channels
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { protocol, enabled } = req.query;
    
    let sql = 'SELECT * FROM channels WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (protocol) {
      sql += ` AND protocol = $${paramCount}`;
      params.push(protocol);
      paramCount++;
    }

    if (enabled !== undefined) {
      sql += ` AND enabled = $${paramCount}`;
      params.push(enabled === 'true');
      paramCount++;
    }

    sql += ' ORDER BY name';

    const result = await query(sql, params);

    res.json({
      channels: result.rows.map(row => ({
        ...row,
        config: row.config,
        metadata: row.metadata
      }))
    });
  } catch (error) {
    logger.error('Error listing channels:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/io/channels/:id
 * Get channel by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM channels WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Channel not found'
        }
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error getting channel:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/io/channels
 * Create new channel
 */
router.post('/', authenticateToken, requireRole('admin', 'engineer'), async (req, res) => {
  try {
    // Validate request body
    const { error, value } = channelSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: error.details[0].message
        }
      });
    }

    // Generate ID if not provided
    const id = value.id || `ch-${Date.now()}`;

    // Check if ID already exists
    const existing = await query('SELECT id FROM channels WHERE id = $1', [id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Channel ID already exists'
        }
      });
    }

    // Insert channel
    const result = await query(
      `INSERT INTO channels (id, name, protocol, enabled, config, metadata, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, value.name, value.protocol, value.enabled, JSON.stringify(value.config), 
       JSON.stringify(value.metadata || {}), req.user.id]
    );

    logger.info(`Channel created: ${id} by ${req.user.username}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating channel:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * PUT /api/v1/io/channels/:id
 * Update channel
 */
router.put('/:id', authenticateToken, requireRole('admin', 'engineer'), async (req, res) => {
  try {
    // Validate request body
    const { error, value } = channelSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: error.details[0].message
        }
      });
    }

    // Check if channel exists
    const existing = await query('SELECT id FROM channels WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Channel not found'
        }
      });
    }

    // Update channel
    const result = await query(
      `UPDATE channels 
       SET name = $1, protocol = $2, enabled = $3, config = $4, metadata = $5
       WHERE id = $6
       RETURNING *`,
      [value.name, value.protocol, value.enabled, JSON.stringify(value.config),
       JSON.stringify(value.metadata || {}), req.params.id]
    );

    logger.info(`Channel updated: ${req.params.id} by ${req.user.username}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating channel:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * DELETE /api/v1/io/channels/:id
 * Delete channel
 */
router.delete('/:id', authenticateToken, requireRole('admin', 'engineer'), async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM channels WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Channel not found'
        }
      });
    }

    logger.info(`Channel deleted: ${req.params.id} by ${req.user.username}`);

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    logger.error('Error deleting channel:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/io/channels/:id/test
 * Test channel connection
 */
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    // Get channel config
    const result = await query(
      'SELECT * FROM channels WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Channel not found'
        }
      });
    }

    // TODO: Implement actual protocol testing
    // For now, return mock response
    res.json({
      success: true,
      message: 'Connection test not yet implemented',
      channelId: req.params.id
    });
  } catch (error) {
    logger.error('Error testing channel:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

export default router;
