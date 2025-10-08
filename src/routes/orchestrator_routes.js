import express from "express";
import { getHistoryByOrchestratorId } from '../controllers/orchestratorController.js';
import {middleware} from "../middlewares/middleware.js";

let router = express.Router();

router.get('/history/:orchestrator_id', middleware, getHistoryByOrchestratorId);

export default router;
