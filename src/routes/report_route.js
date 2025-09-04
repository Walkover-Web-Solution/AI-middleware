import express from "express";
import {getWeeklyreports, getDailyreports, getMessageData} from "../controllers/reportController.js";


let router = express.Router();

router.post('/monthly', getWeeklyreports);
router.post('/daily', getDailyreports);
router.post('/message-data', getMessageData);

export default router;