import express from 'express';
import { getOrgAndBridgesByFunctionId } from '../controllers/internal.controller.js';
import { InternalAuth } from '../middlewares/middleware.js';

const router = express.Router();

// Define the subscribe route
router.post('/functions', InternalAuth, getOrgAndBridgesByFunctionId);

export default router;