import { Router } from 'express';
import { chatBotAuth } from '../middlewares/interfaceMiddlewares.js';
import { createThreadController, getAllThreadsController } from '../controllers/threadController.js';

const router = Router();
// Define routes
router.post('/', chatBotAuth, createThreadController);
router.get('/:thread_id', chatBotAuth, getAllThreadsController);

export default router;
