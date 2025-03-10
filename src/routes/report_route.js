import express from "express";
// import {middleware} from "../middlewares/middleware.js";
import {getWeeklyreports} from "../controllers/reportController.js";


let router = express.Router();

router.get('/weekly', getWeeklyreports);


export default router;