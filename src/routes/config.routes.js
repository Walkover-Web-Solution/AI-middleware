import express from 'express';
import { middleware } from '../middlewares/middleware.js';
import * as agentConfigController from '../controllers/agentConfig.controller.js';

const router = express.Router();

router.get('/service/models/:service', middleware, agentConfigController.getAllServiceModelsController);

router.get('/service', middleware, agentConfigController.getAllServiceController);

router.get('/getbridges/all', middleware, agentConfigController.getAllBridgesController);

router.get('/getbridge/:bridgeId', middleware, agentConfigController.getBridgeController);

router.post('/create_bridge', middleware, agentConfigController.createBridgesController);

router.post('/update_bridge/:bridgeId', middleware, agentConfigController.updateBridgeController);

router.post('/createapi', middleware, agentConfigController.createApi);

router.post('/updateapi/:bridgeId', middleware, agentConfigController.updateApi);

router.get('/inbuilt/tools', middleware, agentConfigController.getAllInBuiltToolsController);

router.get('/getBridgesAndVersions/:modelName', agentConfigController.getBridgesAndVersionsByModelController);

router.post('/clone_agent', middleware, agentConfigController.cloneAgentController);

export default router;
