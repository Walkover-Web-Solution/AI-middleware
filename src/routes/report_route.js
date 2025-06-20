import express from "express";
import {getWeeklyreports, getDailyreports} from "../controllers/reportController.js";


let router = express.Router();

router.post('/monthly', getWeeklyreports);
router.post('/daily', getDailyreports);

export default router;