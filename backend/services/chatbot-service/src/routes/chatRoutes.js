import express from 'express';
import { sendMessage, getHistory, clearHistory, getAllConversations, createNewConversation } from '../controllers/chatController.js';
import { authenticateOrGuest } from '../middlewares/authMiddleware.js';
import { validateMessage } from '../validators/chatValidators.js';

const router = express.Router();

// All chat routes now support both authenticated users and guest sessions
router.post('/message', authenticateOrGuest, validateMessage, sendMessage);
router.get('/history/:id', authenticateOrGuest, getHistory);
router.delete('/history/:id', authenticateOrGuest, clearHistory);

// New endpoints for managing multiple conversations
router.get('/conversations', authenticateOrGuest, getAllConversations);
router.post('/conversations/new', authenticateOrGuest, createNewConversation);

export default router;
