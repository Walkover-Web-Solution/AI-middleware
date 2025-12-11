import express from 'express';
import { middleware, checkAgentAccessMiddleware, requireAdminRole } from '../middlewares/middleware.js';
import * as agentConfigController from '../controllers/agentConfig.controller.js';
import validate from '../middlewares/validate.middleware.js';
import conversationValidation from '../validation/joi_validation/conversation.validation.js';

const router = express.Router();

router.get('/', middleware, agentConfigController.getAllAgentController);

router.get('/:bridgeId', middleware, checkAgentAccessMiddleware, agentConfigController.getAgentController);

router.post('/', middleware, requireAdminRole, agentConfigController.createAgentController);

router.put('/:bridge_id', middleware, requireAdminRole, agentConfigController.updateAgentController);

router.post('/clone', middleware, requireAdminRole, agentConfigController.cloneAgentController);

router.delete('/:bridge_id', middleware, requireAdminRole, validate(conversationValidation.deleteBridges), agentConfigController.deleteAgentController);

export default router;
