import { Router } from 'express';
import { createThreadController, getAllThreadsController } from '../controllers/threadController.js';
import { combine_middleware} from '../middlewares/middleware.js';

const router = Router();
// Define routes
router.post('/', combine_middleware, createThreadController);
router.get('/:thread_id', combine_middleware, getAllThreadsController);

export default router;
