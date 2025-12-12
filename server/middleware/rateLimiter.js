// server/middleware/rateLimiter.js - COMPLETE

import rateLimit from 'express-rate-limit';

// ✅ Public payment page limiter
export const publicPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per IP per 15 minutes
  message: {
    message: 'Too many payment attempts from this IP. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const isDev = process.env.NODE_ENV === 'development';
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1';
    return isDev && isLocalhost;
  },
  handler: (req, res) => {
    console.warn(`[RateLimit] Blocked request from ${req.ip} to ${req.path}`);
    res.status(429).json({
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// ✅ Payment initialization limiter (stricter)
export const paymentInitLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Max 3 payment initializations per 5 minutes
  message: {
    message: 'Too many payment attempts. Please wait before trying again.',
    retryAfter: '5 minutes'
  },
  keyGenerator: (req) => {
    return `${req.ip}-${req.params.token}`;
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

// ✅ Payment verification limiter
export const paymentVerifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Max 20 verification requests per minute
  message: {
    message: 'Too many verification attempts. Please wait.',
    retryAfter: '1 minute'
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

export default {
  publicPaymentLimiter,
  paymentInitLimiter,
  paymentVerifyLimiter
};