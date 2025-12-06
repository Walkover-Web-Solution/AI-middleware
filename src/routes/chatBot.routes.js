import express from "express";
import { getAllChatBots } from "../controllers/chatBot.controller.js";
import { subscribe } from '../controllers/hello.controller.js';
import { middleware } from "../middlewares/middleware.js";
import userOrgAccessCheck from "../middlewares/userOrgCheck.js";
import { combinedAuthWithChatBotAndPublicChatbot } from '../middlewares/interfaceMiddlewares.js';
import validate from '../middlewares/validate.middleware.js';
import chatBotValidation from '../validation/joi_validation/chatBot.validation.js';

const router = express.Router();

// Define the subscribe route
router.post('/subscribe', combinedAuthWithChatBotAndPublicChatbot, subscribe);

// Get all chatbots
router.get('/', middleware, userOrgAccessCheck, validate(chatBotValidation.getAllChatBots), getAllChatBots);

export default router;
