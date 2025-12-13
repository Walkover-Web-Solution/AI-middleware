import express from "express";
import { middleware } from "../middlewares/middleware.js";
import controller from "../controllers/apiCall.controller.js";
import validate from '../middlewares/validate.middleware.js';
import apiCallValidation from '../validation/joi_validation/apiCall.validation.js';

const router = express.Router();

router.get('/', middleware, controller.getAllApiCalls);
router.put('/:tool_id', middleware, validate(apiCallValidation.updateApiCalls), controller.updateApiCalls);
router.delete('/', middleware, validate(apiCallValidation.deleteFunction), controller.deleteFunction);
router.post('/', middleware, validate(apiCallValidation.createApi), controller.createApi);
router.put('/pre_tool/:agent_id', middleware, validate(apiCallValidation.addPreTool), controller.addPreTool);
router.get('/inbuilt', middleware, controller.getAllInBuiltToolsController);

export default router;
