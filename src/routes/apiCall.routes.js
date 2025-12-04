import express from "express";
import { middleware } from "../middlewares/middleware.js";
import controller from "../controllers/apiCall.controller.js";

const router = express.Router();

router.get('/all', middleware, controller.getAllApiCalls);
router.put('/:function_id', middleware, controller.updateApiCalls);
router.delete('/', middleware, controller.deleteFunction);

export default router;
