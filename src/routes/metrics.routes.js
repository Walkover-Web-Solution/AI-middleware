import express from "express";
import { middleware } from "../middlewares/middleware.js";
import { get_metrics_data } from "../controllers/metrics.controller.js";
import validate from '../middlewares/validate.middleware.js';
import metricsValidation from '../validation/joi_validation/metrics.validation.js';

const router = express.Router();

router.post('/', middleware, validate(metricsValidation.getMetricsData), get_metrics_data);

export default router;