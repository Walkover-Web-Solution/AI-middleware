import express from 'express';
import FlowController from '../controllers/FlowController.js';

const router = express.Router();

/**
 * @route POST /flow/copy
 * @desc Copy flows based on folder_id and user_id
 * @access Private
 */
router.post('/copy', FlowController.copyFlows);

export default router;
