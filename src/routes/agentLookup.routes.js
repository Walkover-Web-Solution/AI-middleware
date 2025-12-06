import express from 'express';
import { getAgentsByModel } from '../controllers/agentLookup.controller.js';
import validate from '../middlewares/validate.middleware.js';
import agentLookupValidation from '../validation/joi_validation/agentLookup.validation.js';

const router = express.Router();

// Example: GET /agents/by-model?model=gpt-4o
router.get('/by-model', validate(agentLookupValidation.getAgentsByModel), getAgentsByModel);

export default router;

