import express from 'express';
import Joi from 'joi';
import { query } from '../../../../shared/utils/db-client.js';
import { createLogger } from '../../../../shared/utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const logger = createLogger('dashboards-routes');

// Validation schema
const dashboardSchema = Joi.object({
  id: Joi.string().max(50),
  name: Joi.string().max(100).required(),
  description: Joi.string().allow('').optional(),
  shared: Joi.boolean().default(false),
  layout: Joi.object().required()
});

/**
 * GET /api/v1/dashboards
 * List dashboards
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { shared } = req.query;
    
    let sql = 'SELECT * FROM dashboards WHERE user_id = $1';
    const params = [req.user.id];

    if (shared === 'true') {
      sql = 'SELECT * FROM dashboards WHERE user_id = $1 OR shared = true';
    }

    sql += ' ORDER BY name';

    const result = await query(sql, params);

    res.json({
      dashboards: result.rows.map(row => ({
        ...row,
        layout: row.layout
      }))
    });
  } catch (error) {
    logger.error('Error listing dashboards:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * GET /api/v1/dashboards/:id
 * Get dashboard by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM dashboards WHERE id = $1 AND (user_id = $2 OR shared = true)',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Dashboard not found'
        }
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error getting dashboard:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/dashboards
 * Create new dashboard
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { error, value } = dashboardSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: error.details[0].message
        }
      });
    }

    const id = value.id || `dash-${Date.now()}`;

    const existing = await query('SELECT id FROM dashboards WHERE id = $1', [id]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Dashboard ID already exists'
        }
      });
    }

    const result = await query(
      `INSERT INTO dashboards (id, name, description, user_id, shared, layout)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, value.name, value.description || '', req.user.id, value.shared, JSON.stringify(value.layout)]
    );

    logger.info(`Dashboard created: ${id} by ${req.user.username}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating dashboard:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * PUT /api/v1/dashboards/:id
 * Update dashboard
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { error, value } = dashboardSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: error.details[0].message
        }
      });
    }

    // Check ownership
    const existing = await query(
      'SELECT id FROM dashboards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Dashboard not found or access denied'
        }
      });
    }

    const result = await query(
      `UPDATE dashboards 
       SET name = $1, description = $2, shared = $3, layout = $4
       WHERE id = $5
       RETURNING *`,
      [value.name, value.description || '', value.shared, JSON.stringify(value.layout), req.params.id]
    );

    logger.info(`Dashboard updated: ${req.params.id} by ${req.user.username}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating dashboard:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * DELETE /api/v1/dashboards/:id
 * Delete dashboard
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM dashboards WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Dashboard not found or access denied'
        }
      });
    }

    logger.info(`Dashboard deleted: ${req.params.id} by ${req.user.username}`);

    res.json({ message: 'Dashboard deleted successfully' });
  } catch (error) {
    logger.error('Error deleting dashboard:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/dashboards/:id/export
 * Export dashboard as JSON
 */
router.post('/:id/export', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM dashboards WHERE id = $1 AND (user_id = $2 OR shared = true)',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Dashboard not found'
        }
      });
    }

    const dashboard = result.rows[0];
    
    res.json({
      version: '1.2.1',
      dashboard: {
        name: dashboard.name,
        description: dashboard.description,
        layout: dashboard.layout
      },
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error exporting dashboard:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/dashboards/import
 * Import dashboard from JSON
 */
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { dashboard } = req.body;

    if (!dashboard || !dashboard.name || !dashboard.layout) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid dashboard format'
        }
      });
    }

    const id = `dash-${Date.now()}`;

    const result = await query(
      `INSERT INTO dashboards (id, name, description, user_id, shared, layout)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, dashboard.name, dashboard.description || '', req.user.id, false, JSON.stringify(dashboard.layout)]
    );

    logger.info(`Dashboard imported: ${id} by ${req.user.username}`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error importing dashboard:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

export default router;
