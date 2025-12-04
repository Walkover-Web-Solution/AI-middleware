import express from "express";
import {middleware} from "../middlewares/middleware.js";
import { metrics_data } from "../controllers/metrics.controller.js";
const router = express.Router();

router.post('/', middleware, metrics_data)
export default router;