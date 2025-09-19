// server/middleware/subscriptionMiddleware.js

const subscriptionGuard = (req, res, next) => {
  // Exclude payment-related routes from the subscription check
  // This is a placeholder for your future payment endpoints
  if (req.path.includes('/payment')) {
    return next();
  }

  if (!req.user || !req.user.subscriptionStatus) {
    return res.status(401).json({ message: 'Not authorized, subscription status not found' });
  }

  if (req.user.subscriptionStatus === 'inactive') {
    return res.status(403).json({ message: 'Subscription is inactive. Please renew to continue using the service.' });
  }

  next();
};

export default subscriptionGuard;
