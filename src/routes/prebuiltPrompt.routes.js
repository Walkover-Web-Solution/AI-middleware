import express from "express";
import prebuiltPromptController from "../controllers/prebuiltPrompt.controller.js";
import { middleware } from "../middlewares/middleware.js";

const router = express.Router();

router.get("/", middleware, prebuiltPromptController.getPrebuiltPrompts);
router.put("/", middleware, prebuiltPromptController.updatePrebuiltPrompt);
router.post("/reset", middleware, prebuiltPromptController.resetPrebuiltPrompts);
router.post("/get-specific", middleware, prebuiltPromptController.getSpecificPrebuiltPrompt);

export default router;
