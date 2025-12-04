import express from "express";
import bridgeController from "../controllers/bridgeController.js";
import { middleware } from "../middlewares/middleware.js";

const router = express.Router();

router.post('/:bridge_id/optimize/prompt', middleware, bridgeController.optimizePromptController);
router.post('/:bridge_id/generateAdditionalTestCases', middleware, bridgeController.generateAdditionalTestCases);
router.post('/summary', middleware, bridgeController.generateSummary);
router.post('/genrate/rawjson', middleware, bridgeController.functionArgsUsingAi);

export default router;
