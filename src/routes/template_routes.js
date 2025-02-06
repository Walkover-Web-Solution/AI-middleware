import express from "express";
import middleware from "../middlewares/middleware.js";
import templateController from "../controllers/templateController.js"

let router = express.Router();
router.get('/', middleware, templateController.getAllTemplates);
router.post('/', middleware, templateController.createTemplate);
router.put('/:id', middleware, templateController.updateTemplate);
router.delete('/:id', middleware, templateController.deleteTemplate);
export default router;