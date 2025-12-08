import express from "express";
import { middleware } from "../middlewares/middleware.js";
import historyController from "../controllers/history.controller.js";
import validate from '../middlewares/validate.middleware.js';
import historyValidation from '../validation/joi_validation/history.validation.js';

const router = express.Router();

// Define routes
router.get('/:agent_id', middleware, validate(historyValidation.getRecentThreads), historyController.getRecentThreads);
router.get('/:agent_id/:thread_id/:sub_thread_id', middleware, validate(historyValidation.getConversationLogs), historyController.getConversationLogs);
router.get('/search/:agent_id', middleware, validate(historyValidation.searchConversationLogs), historyController.searchConversationLogs);

export default router;

