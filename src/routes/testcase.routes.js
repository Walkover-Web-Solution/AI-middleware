import express from "express";
import { middleware } from "../middlewares/middleware.js";
import testcaseController from "../controllers/testcase.controller.js";

const router = express.Router();

// Create a new testcase
router.post('/create', middleware, testcaseController.createTestcase);

// Delete a testcase by _id
router.delete('/:testcase_id', middleware, testcaseController.deleteTestcase);

// Get all testcases by bridge_id
router.get('/:bridge_id', middleware, testcaseController.getAllTestcases);

export default router;
