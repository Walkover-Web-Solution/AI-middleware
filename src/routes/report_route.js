import express from "express";
import {getWeeklyreports} from "../controllers/reportController.js";


let router = express.Router();

router.post('/monthly', getWeeklyreports);


export default router;