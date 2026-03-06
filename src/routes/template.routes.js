import express from "express";
import templateController from "../controllers/template.controller.js";
import { middleware } from "../middlewares/middleware.js";

const router = express.Router();

router.get("/", templateController.allTemplates);
router.post("/:bridge_id", middleware, templateController.createTemplate);

export default router;
