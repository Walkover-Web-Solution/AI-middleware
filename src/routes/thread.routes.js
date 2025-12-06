import express from "express";
import { createSubThreadWithAiController, createSubThreadController, getAllSubThreadController } from '../controllers/thread.controller.js';
import { combinedAuthWithChatBotAndPublicChatbot } from '../middlewares/interfaceMiddlewares.js';

const router = express.Router();

// Define routes
router.post('/', combinedAuthWithChatBotAndPublicChatbot, createSubThreadController);
router.post('/ai', combinedAuthWithChatBotAndPublicChatbot, createSubThreadWithAiController);
router.get('/:thread_id', combinedAuthWithChatBotAndPublicChatbot, getAllSubThreadController);

export default router;
