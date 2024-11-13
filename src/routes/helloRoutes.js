import express from 'express';
import { subscribe } from '../controllers/helloController.js';

const router = express.Router();

// Define the subscribe route
router.post('/subscribe', subscribe);

export default router; 