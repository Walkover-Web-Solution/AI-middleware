import express from "express";
import utilsController from "../controllers/utilsController.js";
import { middleware } from "../middlewares/middleware.js";

const router = express.Router();

router.delete('/redis', utilsController.clearRedisCache);
router.get('/redis/:id', utilsController.getRedisCache);
router.post('/structured_output', middleware, utilsController.structuredOutput);
router.get('/gpt-memory', middleware, utilsController.retrieveGptMemory);
router.post('/improve_prompt', utilsController.improvePrompt);

export default router;
