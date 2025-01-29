import { Router } from 'express';
import { createSubThreadWithAi, createThreadController, getAllThreadsController } from '../controllers/threadController.js';
import { combine_middleware } from '../middlewares/middleware.js';
import { chatBotAuth } from '../middlewares/interfaceMiddlewares.js';

const router = Router();
// Define routes
router.post('/', chatBotAuth, createThreadController);
router.post('/new', chatBotAuth, createSubThreadWithAi);
router.get('/:thread_id', combine_middleware, getAllThreadsController);

export default router;
