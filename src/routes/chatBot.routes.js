import express from "express";
import { getAllChatBots, getOneChatBot, updateChatBotConfig, loginUser, createOrRemoveAction, addorRemoveBridgeInChatBot } from "../controllers/chatBot.controller.js";
import { subscribe } from '../controllers/hello.controller.js';
import { middleware } from "../middlewares/middleware.js";
import userOrgAccessCheck from "../middlewares/userOrgCheck.js";
import { combinedAuthWithChatBotAndPublicChatbot, combinedAuthWithChatBotTokenDecodeAndPublicChatbot } from '../middlewares/interfaceMiddlewares.js';
import validate from '../middlewares/validate.middleware.js';
import chatBotValidation from '../validation/joi_validation/chatBot.validation.js';

const router = express.Router();

// Define the subscribe route
router.post('/subscribe', combinedAuthWithChatBotAndPublicChatbot, validate(chatBotValidation.subscribe), subscribe);

// Get all chatbots
router.get('/', middleware, getAllChatBots);

// Get one chatbot
router.get('/:botId', middleware, validate(chatBotValidation.getOneChatBot), getOneChatBot);

// Login user
router.post('/loginuser', combinedAuthWithChatBotTokenDecodeAndPublicChatbot, validate(chatBotValidation.loginUser), loginUser);

// Update chatbot config
router.post('/:botId/updateconfig', middleware, validate(chatBotValidation.updateChatBotConfig), updateChatBotConfig);

// Add or Remove Bridge in ChatBot
router.put('/agent', middleware, userOrgAccessCheck, validate(chatBotValidation.addOrRemoveBridgeInChatBot), addorRemoveBridgeInChatBot);

// Create or Remove Action
router.post('/agent/:agentId/action', middleware, validate(chatBotValidation.createOrRemoveAction), createOrRemoveAction);

export default router;