import express from "express"
import { allTemplates } from "../controllers/templateController.js";
const router = express.Router();

router.get('/all', allTemplates)

export default router;