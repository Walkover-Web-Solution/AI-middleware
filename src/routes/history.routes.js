import express from "express";
import { middleware } from "../middlewares/middleware.js";
import historyController from "../controllers/history.controller.js";
const router = express.Router();

// Define routes
router.get('/threads/:bridge_id', middleware, historyController.getRecentThreads);
router.get('/:bridge_id/:thread_id/:sub_thread_id', middleware, historyController.getConversationLogs);
router.post('/search/:bridge_id', middleware, historyController.searchConversationLogs);

export default router;

