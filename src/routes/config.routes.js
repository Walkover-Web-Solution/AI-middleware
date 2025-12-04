import express from 'express';
import { middleware } from '../middlewares/middleware.js';
import * as agentConfigController from '../controllers/agentConfig.controller.js';

const router = express.Router();

router.get('/', middleware, agentConfigController.getAllBridgesController);

router.get('/:bridgeId', middleware, agentConfigController.getBridgeController);

router.post('/', middleware, agentConfigController.createBridgesController);

router.put('/:bridgeId', middleware, agentConfigController.updateBridgeController);

router.get('/getBridgesAndVersions/:modelName', agentConfigController.getBridgesAndVersionsByModelController); // add in utils

router.post('/clone', middleware, agentConfigController.cloneAgentController);

export default router;
