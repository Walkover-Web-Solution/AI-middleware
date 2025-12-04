import express from 'express';
import { getAgentsByModel } from '../controllers/agentLookup.controller.js';

const router = express.Router();

// Example: GET /agents/by-model?model=gpt-4o
router.get('/by-model', getAgentsByModel);

export default router;

