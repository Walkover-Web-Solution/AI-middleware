import express from "express";
import { getWeeklyreports, getMessageData } from "../controllers/reportController.js";


let router = express.Router();

router.post('/monthly', getWeeklyreports);

router.post('/message-data', getMessageData);

export default router;