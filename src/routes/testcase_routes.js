import express from "express";
import { middleware } from "../middlewares/middleware.js";
import { saveTestcases, updateTestcases, deleteTestcases } from "../controllers/testcaseController.js";

const router = express.Router();

router.post('/', middleware, saveTestcases);
router.put('/', middleware, updateTestcases);
router.delete('/', middleware, deleteTestcases);

export default router;
