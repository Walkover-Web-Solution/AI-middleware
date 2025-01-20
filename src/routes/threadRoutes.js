import { Router } from 'express';
import { chatBotAuth } from '../middlewares/interfaceMiddlewares.js';
import { createThreadController, getAllThreadsController } from '../controllers/threadController.js';
import middleware from '../middlewares/middleware.js';

const router = Router();
// Define routes
router.post('/', chatBotAuth, createThreadController);
router.get('/:thread_id', (req, res, next) => {
  const authMiddleware = req.headers['proxy_auth_token'] ? middleware : chatBotAuth;
  authMiddleware(req, res, next);
}, getAllThreadsController);

export default router;
