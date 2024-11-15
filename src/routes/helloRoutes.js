import express from 'express';
import { subscribe } from '../controllers/helloController.js';
import { chatBotAuth } from '../middlewares/interfaceMiddlewares.js';

const router = express.Router();

// Define the subscribe route
router.post('/subscribe', chatBotAuth, subscribe);

export default router; 