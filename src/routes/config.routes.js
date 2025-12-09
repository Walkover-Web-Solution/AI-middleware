import express from 'express';
import { middleware } from '../middlewares/middleware.js';
import * as agentConfigController from '../controllers/agentConfig.controller.js';
import validate from '../middlewares/validate.middleware.js';
import conversationValidation from '../validation/joi_validation/conversation.validation.js';

const router = express.Router();

router.get('/', middleware, agentConfigController.getAllBridgesController);

router.get('/:bridgeId', middleware, agentConfigController.getBridgeController);

router.post('/', middleware, agentConfigController.createBridgesController);

router.put('/:version_id', middleware, agentConfigController.updateBridgeController);

router.post('/clone', middleware, agentConfigController.cloneAgentController);

router.delete('/:bridge_id', middleware, validate(conversationValidation.deleteBridges), agentConfigController.deleteBridges);

export default router;
