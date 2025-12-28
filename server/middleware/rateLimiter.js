// server/middleware/rateLimiter.js - FIXED VERSION

import rateLimit from 'express-rate-limit';

// ✅ REMOVED rate limiting on viewing payment page
// Parents can refresh as many times as they want

// ✅ Payment initialization limiter (actual payment action)
export const paymentInitLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 initialization attempts per token per 5 minutes
  
  keyGenerator: (req) => {
    // Rate limit by token + IP combination
    const token = req.params.token || 'unknown';
    return `init-${token}-${req.ip}`;
  },
  
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  },
  
  message: {
    message: 'Too many payment attempts. Please wait 5 minutes and try again.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  
  handler: (req, res) => {
    console.warn(`[RateLimit] Payment init blocked: ${req.params.token} from ${req.ip}`);
    res.status(429).json({
      message: 'Too many payment attempts. Please wait a moment and try again.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 300 // 5 minutes in seconds
    });
  }
});

// ✅ Payment verification limiter
export const paymentVerifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 verification requests per minute
  
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  },
  
  message: {
    message: 'Too many verification attempts. Please wait.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

