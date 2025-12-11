import express from 'express';
import { middleware, checkAgentAccessMiddleware, requireOwnerRole } from '../middlewares/middleware.js';
import * as agentConfigController from '../controllers/agentConfig.controller.js';
import validate from '../middlewares/validate.middleware.js';
import conversationValidation from '../validation/joi_validation/conversation.validation.js';

const router = express.Router();

router.get('/', middleware, agentConfigController.getAllAgentController);

router.get('/:bridgeId', middleware, checkAgentAccessMiddleware, agentConfigController.getAgentController);

router.post('/', middleware, requireOwnerRole, agentConfigController.createAgentController);

router.put('/:bridge_id', middleware, requireOwnerRole, agentConfigController.updateAgentController);

router.post('/clone', middleware, requireOwnerRole, agentConfigController.cloneAgentController);

router.delete('/:bridge_id', middleware, requireOwnerRole, validate(conversationValidation.deleteBridges), agentConfigController.deleteAgentController);

export default router;
