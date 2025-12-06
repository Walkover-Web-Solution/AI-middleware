import express from "express";
import { middleware } from "../middlewares/middleware.js";
import alertingController from "../controllers/alerting.controller.js";

const router = express.Router();

router.post('/', middleware, alertingController.createAlert);
router.get('/', middleware, alertingController.getAllAlerts);
router.put('/:id', middleware, alertingController.updateAlert);
router.delete('/', middleware, alertingController.deleteAlert);

export default router;
