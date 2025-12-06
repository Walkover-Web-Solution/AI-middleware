import express from "express";
import { getAllChatBots } from "../controllers/chatBot.controller.js";
import { subscribe } from '../controllers/hello.controller.js';
import { middleware } from "../middlewares/middleware.js";
import userOrgAccessCheck from "../middlewares/userOrgCheck.js";
import { combinedAuthWithChatBotAndPublicChatbot } from '../middlewares/interfaceMiddlewares.js';

const router = express.Router();

// Define the subscribe route
router.post('/subscribe', combinedAuthWithChatBotAndPublicChatbot, subscribe);

// Get all chatbots
router.get('/:orgId/all', middleware, userOrgAccessCheck, getAllChatBots);

export default router;
