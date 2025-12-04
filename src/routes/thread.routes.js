import { Router } from 'express';
import { createSubThreadWithAi, createThreadController, getAllThreadsController } from '../controllers/thread.controller.js';
import { combinedAuthWithChatBotAndPublicChatbot } from '../middlewares/interfaceMiddlewares.js';

const router = Router();
// Define routes
router.post('/', combinedAuthWithChatBotAndPublicChatbot, createThreadController);
router.post('/new', combinedAuthWithChatBotAndPublicChatbot, createSubThreadWithAi);
router.get('/:thread_id', combinedAuthWithChatBotAndPublicChatbot, getAllThreadsController);

export default router;
