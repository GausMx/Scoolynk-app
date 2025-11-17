import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user || !req.user.schoolId) {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }

      next();
    } catch (err) {
      console.error('[AuthMiddleware]', err);
      return res.status(401).json({ message: 'Token failed or expired' });
    }
  }

  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });
};

export default protect;
