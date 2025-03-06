import express from 'express';
import { getOrgAndBridgesByFunctionId } from '../controllers/InternalController.js';
import { InternalAuth, ReturnAuth } from '../middlewares/middleware.js';

const router = express.Router();

// Define the subscribe route
router.post('/functions', InternalAuth, getOrgAndBridgesByFunctionId);

router.post('/auth', ReturnAuth);

export default router; 