import { Router } from 'express';

import { getAllBridges, getBridges, getThreads, getMessageHistory, getAIModels, createBridges, updateBridges, deleteBridges } from "../services/commonService/configServices.js";
import { middleware } from "../../middlewares/middleware.js";
import { createsApi } from "../services/commonService/apiCallService.js";
let router = Router();


router.get('/getbridges/all', middleware, getAllBridges); //Done
router.get('/getbridges/:bridge_id', middleware, getBridges); //Done
router.get('/threads/:thread_id/:bridge_id', middleware, getThreads);
router.get('/history/:bridge_id', middleware, getMessageHistory);
router.get('/models/:service', middleware, getAIModels);  //Done
router.post('/createbridges', middleware, createBridges);  //Done
router.post('/updatebridges/:bridge_id', middleware, updateBridges);  //Done
router.put('/createbridges/:bridge_id', middleware, updateBridges);
router.delete('/deletebridges/:bridge_id', middleware, deleteBridges);
router.get('/gethistory/:thread_id/:bridge_id', middleware, getThreads);  //Public API for getting history for particular thread
router.post('/createapi/:bridge_id', middleware, createsApi); //vaisocket embed create api.
export default router;