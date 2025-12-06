import express from "express";
import { getAllChatBots } from "../controllers/chatBot.controller.js";
import { middleware } from "../middlewares/middleware.js";
import userOrgAccessCheck from "../middlewares/userOrgCheck.js";

const router = express.Router();

// Get all chatbots
router.get('/:orgId/all', middleware, userOrgAccessCheck, getAllChatBots);

export default router;
