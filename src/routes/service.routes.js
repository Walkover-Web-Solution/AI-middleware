import express from "express";
import { middleware } from "../middlewares/middleware.js";
import serviceController from "../controllers/service.controller.js";

const router = express.Router();

router.get("/", middleware, serviceController.getAllServiceController);
router.get("/:service", middleware, serviceController.getAllServiceModelsController);

export default router;
