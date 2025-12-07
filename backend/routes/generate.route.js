import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { generate, chat } from '../controllers/generate.controller.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    limit: 10, // 10 requests per minute
    message: { success: false, error: "Too many AI requests, please slow down." }
});

router.post('/generate', verifyToken, aiLimiter, generate);
router.post('/chat', verifyToken, aiLimiter, chat);

export default router;

