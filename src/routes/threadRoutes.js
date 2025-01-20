import { Router } from 'express';
import { chatBotAuth } from '../middlewares/interfaceMiddlewares.js';
import { createThreadController, getAllThreadsController } from '../controllers/threadController.js';
import middleware from '../middlewares/middleware.js';

const router = Router();
// Define routes
router.post('/', chatBotAuth, createThreadController);
router.get('/:thread_id', [chatBotAuth, middleware], getAllThreadsController);

export default router;
