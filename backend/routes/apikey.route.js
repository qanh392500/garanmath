import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { getApiKey, saveApiKey, deleteApiKey, testApiKey } from '../controllers/apikey.controller.js';

const router = express.Router();

router.get('/user/apikey', verifyToken, getApiKey);
router.post('/user/apikey', verifyToken, saveApiKey);
router.delete('/user/apikey', verifyToken, deleteApiKey);
router.post('/test-apikey', testApiKey);

export default router;

