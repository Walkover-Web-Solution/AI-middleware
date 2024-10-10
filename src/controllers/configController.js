import express from "express";
import common from "../services/commonService/configServices.js";
import middleware from "../middlewares/middleware.js";
import createApi from "../services/commonService/apiCallService.js";
import {statusMiddleware}  from '../middlewares/statusMiddleware.js';
let router = express.Router();

router.get('/threads/:thread_id/:bridge_id', middleware, common.getThreads,statusMiddleware);
router.get('/history/:bridge_id', middleware, common.getMessageHistory,statusMiddleware);
router.delete('/deletebridges/:bridge_id', middleware, common.deleteBridges,statusMiddleware);
router.get('/gethistory/:thread_id/:bridge_id', middleware, common.getThreads,statusMiddleware); //Public API for getting history for particular thread
router.post('/createapi/:bridge_id', middleware, createApi.createsApi); //vaisocket embed create api.
router.put('/:bridge_id', middleware, common.updateBridgeType);
router.get('/systemprompt/gethistory/:bridge_id/:timestamp', middleware, common.getSystemPromptHistory,statusMiddleware);
router.post('/getFineTuneData/:bridge_id', middleware, common.FineTuneData,statusMiddleware);
router.put('/gethistory/:bridge_id', middleware, common.updateThreadMessage,statusMiddleware);
router.put('/status/:status', common.updateMessageStatus,statusMiddleware);

export default router;