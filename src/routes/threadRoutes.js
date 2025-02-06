import { Router } from 'express';
import { createSubThreadWithAi, createThreadController, getAllThreadsController } from '../controllers/threadController.js';
import { combine_middleware } from '../middlewares/middleware.js';

const router = Router();
// Define routes
router.post('/', combine_middleware, createThreadController);
router.post('/new', combine_middleware, createSubThreadWithAi);
router.get('/:thread_id', combine_middleware, getAllThreadsController);

export default router;
