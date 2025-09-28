/**
 * Simple in-memory rate limiter for admin create user endpoint
 * Prevents abuse by limiting requests per IP address
 */

const rateLimitStore = new Map();

/**
 * Rate limiter middleware for admin create user endpoint
 * Allows 5 requests per 15 minutes per IP
 */
const adminCreateUserRateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  const key = `admin-create-user:${clientIP}`;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;
  
  const now = Date.now();
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      requests: 1,
      resetTime: now + windowMs
    });
    return next();
  }
  
  const limitData = rateLimitStore.get(key);
  
  // Reset if window has passed
  if (now > limitData.resetTime) {
    rateLimitStore.set(key, {
      requests: 1,
      resetTime: now + windowMs
    });
    return next();
  }
  
  // Check if limit exceeded
  if (limitData.requests >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many user creation requests. Please try again later.',
      retryAfter: Math.ceil((limitData.resetTime - now) / 1000)
    });
  }
  
  // Increment request count
  limitData.requests++;
  rateLimitStore.set(key, limitData);
  
  next();
};

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

module.exports = {
  adminCreateUserRateLimit
};