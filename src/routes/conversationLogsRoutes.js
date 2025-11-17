import express from "express";
import { middleware } from "../middlewares/middleware.js";
import { getConversationLogsController, getRecentThreadsController } from "../controllers/conversationLogsController.js";

const router = express.Router();

// Define routes
router.get('/threads/:bridge_id', middleware, getRecentThreadsController);
router.get('/:bridge_id/:thread_id/:sub_thread_id', middleware, getConversationLogsController);

export default router;
