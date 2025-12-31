import express from "express";
import {
    createRichUiTemplate,
    getRichUiTemplates,
    updateRichUiTemplate,
    deleteRichUiTemplate
} from "../controllers/richUiTemplate.controller.js";
import { middleware } from "../middlewares/middleware.js";


const router = express.Router();

// Create a new rich UI template
router.post("/", middleware, createRichUiTemplate);

// Get all templates for an organization (with optional filtering)
router.get("/", middleware, getRichUiTemplates);

// Update a template
router.put("/:template_id", middleware, updateRichUiTemplate);

// Delete a template (soft delete)
router.delete("/:template_id", middleware, deleteRichUiTemplate);

export default router;
