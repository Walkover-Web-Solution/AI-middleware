import express from "express";
import { middleware } from "../middlewares/middleware.js";
import { getOrchestratorConversationLogsController, getOrchestratorRecentThreadsController, searchOrchestratorConversationLogsController } from "../controllers/orchestratorConversationLogsController.js";
import { combinedAuthWithChatBotAndPublicChatbot } from "../middlewares/interfaceMiddlewares.js";
const router = express.Router();

// Define routes
router.get('/threads/:bridge_id', middleware, getOrchestratorRecentThreadsController);
router.get('/:bridge_id/:thread_id/:sub_thread_id', combinedAuthWithChatBotAndPublicChatbot, getOrchestratorConversationLogsController);
router.post('/search/:bridge_id', middleware, searchOrchestratorConversationLogsController);

export default router;


