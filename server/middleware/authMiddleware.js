import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let accessToken;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    accessToken = req.headers.authorization.split(' ')[1];
    
    try {
      // Verify and decode the JWT token
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      
      // Fetch user from database
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // ✅ CRITICAL FIX: Verify schoolId in token matches user's actual schoolId
      // This prevents token tampering where someone modifies the JWT to change schoolId
      if (decoded.schoolId !== req.user.schoolId.toString()) {
        console.error('[AuthMiddleware] SchoolId mismatch detected!', {
          tokenSchoolId: decoded.schoolId,
          userSchoolId: req.user.schoolId.toString(),
          userId: req.user._id
        });
        return res.status(401).json({ message: 'Invalid token credentials' });
      }

      // Ensure user has a schoolId
      if (!req.user.schoolId) {
        return res.status(401).json({ message: 'School association missing' });
      }

      next();
    } catch (err) {
      console.error('[AuthMiddleware] Error:', err.message);
      return res.status(401).json({ message: 'Token failed or expired' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

export default protect;