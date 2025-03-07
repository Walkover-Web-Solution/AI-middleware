import express from "express";
import {middleware} from "../middlewares/middleware.js";
import { getTestcases, saveTestcases, updateTestcases, deleteTestcases } from "../controllers/testcaseController.js";
const router = express.Router();

router.get('/',middleware, getTestcases)
router.post('/',middleware, saveTestcases)
router.put('/',middleware, updateTestcases)
router.delete('/',middleware, deleteTestcases)

export default router;