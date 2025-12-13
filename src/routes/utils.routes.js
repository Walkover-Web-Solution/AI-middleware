import express from "express";
import utilsController from "../controllers/utils.controller.js";
import * as agentConfigController from "../controllers/agentConfig.controller.js";
import { middleware } from "../middlewares/middleware.js";
import validate from "../middlewares/validate.middleware.js";
import utilsValidation from "../validation/joi_validation/utils.validation.js";

const router = express.Router();

router.delete('/redis', validate(utilsValidation.clearRedisCache), utilsController.clearRedisCache);
router.get('/redis/:id', validate(utilsValidation.getRedisCache), utilsController.getRedisCache);
router.post('/call-gtwy', middleware, validate(utilsValidation.callAi), utilsController.callGtwy);
router.get('/getBridgesAndVersions/:modelName', agentConfigController.getAgentsAndVersionsByModelController);
router.post('/token', middleware, validate(utilsValidation.generateToken), utilsController.generateToken);

export default router;
