import jwt from 'jsonwebtoken';
import { createLogger } from '../../../../shared/utils/logger.js';

const logger = createLogger('auth-middleware');

/**
 * JWT authentication middleware
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token:', error.message);
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid or expired token'
      }
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Requires one of: ${roles.join(', ')}`
        }
      });
    }

    next();
  };
}
