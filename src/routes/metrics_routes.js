import express from "express";
import { middleware } from "../middlewares/middleware.js";
import { metrics_data, bridge_metrics } from "../controllers/metrics_controller.js";
const router = express.Router();

router.post('/', middleware, metrics_data)
router.post('/bridge', middleware, bridge_metrics)
export default router;