import express from "express";
import { middleware } from "../middlewares/middleware.js";
import alertingController from "../controllers/alerting.controller.js";
import validate from '../middlewares/validate.middleware.js';
import alertingValidation from '../validation/joi_validation/alerting.validation.js';

const router = express.Router();

router.post('/', middleware, validate(alertingValidation.createAlert), alertingController.createAlert);
router.get('/', middleware, alertingController.getAllAlerts);
router.put('/:id', middleware, validate(alertingValidation.updateAlert), alertingController.updateAlert);
router.delete('/', middleware, validate(alertingValidation.deleteAlert), alertingController.deleteAlert);

export default router;
