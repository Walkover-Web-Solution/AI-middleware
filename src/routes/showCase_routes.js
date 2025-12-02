import { Router } from 'express';
import { getAllDataForShowCaseController } from '../controllers/showCaseController.js';

const router = Router();

// GET /all -> Get All Data for ShowCase
router.get('/all', getAllDataForShowCaseController);

export default router;
