import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { verifyAdmin } from '../middleware/verifyAdmin.js';
import { promoteMe, getUsers, deleteUser, syncRAG } from '../controllers/admin.controller.js';

const router = express.Router();

// Test route to verify router is working
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Admin routes are working!' });
});

// Promote to admin (requires authentication, not admin yet)
router.post('/promote-me', verifyToken, promoteMe);

// Admin only routes
router.get('/users', verifyToken, verifyAdmin, getUsers);
router.delete('/users/:id', verifyToken, verifyAdmin, deleteUser);
router.post('/rag/sync', verifyToken, verifyAdmin, syncRAG);

export default router;

