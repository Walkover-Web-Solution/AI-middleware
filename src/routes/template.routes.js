import express from "express";
import templateController from "../controllers/template.controller.js";

const router = express.Router();

router.get("/", templateController.allTemplates);

export default router;
