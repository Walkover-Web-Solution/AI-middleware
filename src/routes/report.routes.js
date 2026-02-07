import express from "express";
import { getWeeklyreports, getMessageData } from "../controllers/report.controller.js";
import validate from "../middlewares/validate.middleware.js";
import reportValidation from "../validation/joi_validation/report.validation.js";

let router = express.Router();

router.post("/monthly", validate(reportValidation.getWeeklyreports), getWeeklyreports);

router.post("/message-data", validate(reportValidation.getMessageData), getMessageData);

export default router;
