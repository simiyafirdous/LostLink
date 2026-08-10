const rateLimit = require("express-rate-limit");

const aiLimitPerHour = Number(process.env.AI_RATE_LIMIT_PER_HOUR) || 20;

/**
 * Rate limiter middleware for AI endpoints.
 * Limits users to 20 AI analysis / match requests per hour by default.
 */
const rateLimitAI = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: aiLimitPerHour,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip || "anonymous";
  },
  validate: false,
  handler: (req, res) => {
    res.status(429).json({
      message: `AI request limit reached. You can perform at most ${aiLimitPerHour} AI operations per hour.`
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = rateLimitAI;
