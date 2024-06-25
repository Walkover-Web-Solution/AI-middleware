import express from "express";
import { promptCompressionUsingGpt } from "../controllers/prompt_controller.js";
import middleware from "../middlewares/middleware.js"; 
const router = express.Router();
router.post('/compression', middleware, promptCompressionUsingGpt);
export default router;