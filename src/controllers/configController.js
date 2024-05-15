import express from "express";
import common from "../services/commonService/configServices.js";
import middleware from "../../middlewares/middleware.js";
import createApi from "../services/commonService/apiCallService.js";
let router = express.Router();
router.get('/getbridges/all', middleware, common.getAllBridges); //Done
router.get('/getbridges/:bridge_id', middleware, common.getBridges); //Done
router.get('/threads/:thread_id/:bridge_id', middleware, common.getThreads);
router.get('/history/:bridge_id', middleware, common.getMessageHistory);
router.get('/models/:service', middleware, common.getAIModels); //Done
router.post('/createbridges', middleware, common.createBridges); //Done
router.post('/updatebridges/:bridge_id', middleware, common.updateBridges); //Done
router.put('/createbridges/:bridge_id', middleware, common.updateBridges);
router.delete('/deletebridges/:bridge_id', middleware, common.deleteBridges);
router.get('/gethistory/:thread_id/:bridge_id', middleware, common.getThreads); //Public API for getting history for particular thread
router.post('/createapi/:bridge_id', middleware, createApi.createsApi); //viaSocket embed create api.
router.get('/systemprompt/gethistory/:bridge_id/:timestamp',middleware,common.getSystemPromptHistory)
export default router;
