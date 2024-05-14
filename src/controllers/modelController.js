import express from 'express';
import * as common from '../services/commonService/common.js';
import { middleware } from "../../middlewares/middleware.js";

const router = express.Router();

router.post('/chat/completion', middleware, common.prochat);
router.post('/playground/chat/completion', middleware, common.getchat);
router.post('/completion', middleware, common.proCompletion);
router.post('/playground/completion', middleware, common.getCompletion);
router.post('/embeddings', middleware, common.proEmbeddings);
router.post('/playground/embeddings', middleware, common.getEmbeddings);

export default router;
