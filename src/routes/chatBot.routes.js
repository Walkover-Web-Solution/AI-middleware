import express from "express";
import { getAllChatBots, updateChatBotConfig, loginUser } from "../controllers/chatBot.controller.js";
import { subscribe } from '../controllers/hello.controller.js';
import { middleware } from "../middlewares/middleware.js";
import userOrgAccessCheck from "../middlewares/userOrgCheck.js";
import { combinedAuthWithChatBotAndPublicChatbot, combinedAuthWithChatBotTokenDecodeAndPublicChatbot } from '../middlewares/interfaceMiddlewares.js';
import validate from '../middlewares/validate.middleware.js';
import chatBotValidation from '../validation/joi_validation/chatBot.validation.js';

const router = express.Router();

// Define the subscribe route
router.post('/subscribe', combinedAuthWithChatBotAndPublicChatbot, subscribe);

// Get all chatbots
router.get('/', middleware, userOrgAccessCheck, validate(chatBotValidation.getAllChatBots), getAllChatBots);

// Login user
router.post('/loginuser', combinedAuthWithChatBotTokenDecodeAndPublicChatbot, loginUser);

// Update chatbot config
router.post('/:botId/updateconfig', middleware, validate(chatBotValidation.updateChatBotConfig), updateChatBotConfig);

export default router;
