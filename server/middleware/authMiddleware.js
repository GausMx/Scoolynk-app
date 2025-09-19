// server/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  // The JWT secret is fetched from your environment variables.
  // It is essential for verifying the token's signature.
  const jwtSecret = process.env.JWT_SECRET;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, jwtSecret);

      // Attach the user object to the request.
      // We exclude the passwordHash for security.
      req.user = await User.findById(decoded.id).select('-passwordHash');
      
      // Multi-tenancy guard: Ensure schoolId is present on the user
      if (!req.user || !req.user.schoolId) {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export default protect;
