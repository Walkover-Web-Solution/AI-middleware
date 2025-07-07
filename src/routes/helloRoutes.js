import express from 'express';
import { subscribe } from '../controllers/helloController.js';
import { combinedAuthWithChatBotAndPublicChatbot } from '../middlewares/interfaceMiddlewares.js';

const router = express.Router();

// Define the subscribe route
router.post('/subscribe', combinedAuthWithChatBotAndPublicChatbot, subscribe);

export default router; 