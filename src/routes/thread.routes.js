import express from "express";
import {
  createSubThreadWithAiController,
  createSubThreadController,
  getAllSubThreadController,
} from "../controllers/thread.controller.js";
import { combinedAuthWithChatBotAndPublicChatbot } from "../middlewares/interfaceMiddlewares.js";
import validate from "../middlewares/validate.middleware.js";
import threadValidation from "../validation/joi_validation/thread.validation.js";

const router = express.Router();

// Define routes
router.post(
  "/",
  combinedAuthWithChatBotAndPublicChatbot,
  validate(threadValidation.createSubThread),
  createSubThreadController
);
router.post(
  "/ai",
  combinedAuthWithChatBotAndPublicChatbot,
  validate(threadValidation.createSubThreadWithAi),
  createSubThreadWithAiController
); // think later
router.get(
  "/:thread_id",
  combinedAuthWithChatBotAndPublicChatbot,
  validate(threadValidation.getAllSubThread),
  getAllSubThreadController
);

export default router;
