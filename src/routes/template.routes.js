import express from "express";
import { middleware } from "../middlewares/middleware.js";
import templateController from "../controllers/template.controller.js";

const router = express.Router();

router.get("/", templateController.allTemplates);
router.get("/token", middleware, templateController.getToken);

export default router;
