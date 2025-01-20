import { Router } from 'express';
import { createThreadController, getAllThreadsController } from '../controllers/threadController.js';
import {middleware, combine_middleware} from '../middlewares/middleware.js';

const router = Router();
// Define routes
router.post('/', middleware, createThreadController);
router.get('/:thread_id', combine_middleware, getAllThreadsController);

export default router;
