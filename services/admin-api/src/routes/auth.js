import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../../../../shared/utils/db-client.js';
import { createLogger } from '../../../../shared/utils/logger.js';

const router = express.Router();
const logger = createLogger('auth-routes');

/**
 * Generate JWT tokens
 */
function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
}

/**
 * POST /api/v1/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Username and password required'
        }
      });
    }

    // Get user from database
    const result = await query(
      'SELECT id, username, password_hash, role, name, email, enabled FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      logger.warn(`Login failed: user not found - ${username}`);
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        }
      });
    }

    const user = result.rows[0];

    if (!user.enabled) {
      logger.warn(`Login failed: user disabled - ${username}`);
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Account disabled'
        }
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      logger.warn(`Login failed: invalid password - ${username}`);
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials'
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    logger.info(`User logged in: ${username}`);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Refresh token required'
        }
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid refresh token'
        }
      });
    }

    // Check if token exists and is not revoked
    const result = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires_at > CURRENT_TIMESTAMP',
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Refresh token expired or revoked'
        }
      });
    }

    // Get user
    const userResult = await query(
      'SELECT id, username, role, name, email FROM users WHERE id = $1 AND enabled = true',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'User not found or disabled'
        }
      });
    }

    const user = userResult.rows[0];

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.json({ accessToken });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout and revoke refresh token
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await query(
        'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
        [refreshToken]
      );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
});

export default router;
