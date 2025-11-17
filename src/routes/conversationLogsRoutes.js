import express from "express";
import { middleware } from "../middlewares/middleware.js";
import { getConversationLogsController } from "../controllers/conversationLogsController.js";

const router = express.Router();

// Define routes
router.get('/:bridge_id/:thread_id/:sub_thread_id', middleware, getConversationLogsController);

export default router;
