import express from "express";
import { middleware } from "../middlewares/middleware.js";
import orchestratorHistoryController from "../controllers/orchestratorHistory.controller.js";
import validate from '../middlewares/validate.middleware.js';
import orchestratorHistoryValidation from '../validation/joi_validation/orchestratorHistory.validation.js';

const router = express.Router();

// Define routes
router.get('/:agent_id', middleware, validate(orchestratorHistoryValidation.getRecentOrchestratorThreads), orchestratorHistoryController.getRecentOrchestratorThreads);
router.get('/:agent_id/:thread_id/:sub_thread_id', middleware, validate(orchestratorHistoryValidation.getOrchestratorConversationLogs), orchestratorHistoryController.getOrchestratorConversationLogs);

export default router;

