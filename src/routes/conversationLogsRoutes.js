import express from "express";
import { middleware } from "../middlewares/middleware.js";
import { getConversationLogsController, getRecentThreadsController, searchConversationLogsController } from "../controllers/conversationLogsController.js";
import { combinedAuthWithChatBotAndPublicChatbot} from "../middlewares/interfaceMiddlewares.js";
const router = express.Router();

// Define routes
router.get('/threads/:bridge_id', middleware, getRecentThreadsController);
router.get('/:bridge_id/:thread_id/:sub_thread_id', middleware, getConversationLogsController);
router.post('/search/:bridge_id', middleware, searchConversationLogsController);

export default router;
