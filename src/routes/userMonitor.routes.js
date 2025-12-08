import express from 'express';
import { middleware } from '../middlewares/middleware.js';
import userMonitorController from '../controllers/userMonitor.controller.js';

const router = express.Router();

router.get('/status',userMonitorController.analyzeClientUserStatus);

export default router;
