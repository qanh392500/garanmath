import express from 'express';
import passport from 'passport';
import { 
    login, 
    logout, 
    signup, 
    verifyEmail, 
    forgotPassword, 
    resetPassword,
    checkAuth 
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { generateTokenAndSetCookie } from '../utils/generateTokenAndSetCookie.js';

const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Google OAuth routes
router.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/google/callback',
    passport.authenticate('google', { 
        failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
        session: false 
    }),
    (req, res) => {
        // Generate JWT token and set cookie
        generateTokenAndSetCookie(req.user._id, res);
        
        // Redirect to frontend with success
        res.redirect(`${process.env.CLIENT_URL}/?auth=success`);
    }
);

export default router;