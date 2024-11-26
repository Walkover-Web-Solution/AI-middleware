import express from "express";
import common from "../services/commonService/configServices.js";
import middleware from "../middlewares/middleware.js";
import createApi from "../services/commonService/apiCallService.js";
import { chatBotAuth } from "../middlewares/interfaceMiddlewares.js";
let router = express.Router();
router.get('/getbridges/all', middleware, common.getAllBridges); //Shifted to Python
router.get('/getbridges/:bridge_id', middleware, common.getBridges); //Shifted to Python
router.get('/threads/:thread_id/:bridge_id', middleware, common.getThreads);
router.post('/threads/:thread_id/:bridge_id', middleware, common.createEntry);

router.get('/history/:bridge_id', middleware, common.getMessageHistory);
router.get('/models/:service', middleware, common.getAIModels);//Shifted to Python
router.post('/createbridges', middleware, common.createBridges); //Shifted to Python
router.post('/updatebridges/:bridge_id', middleware, common.updateBridges); //Shifted to Python
router.put('/createbridges/:bridge_id', middleware, common.updateBridges); //Shifted to Python
router.delete('/deletebridges/:bridge_id', middleware, common.deleteBridges);
router.get('/gethistory/:thread_id/:bridge_id', middleware, common.getThreads); //Public API for getting history for particular thread
router.get('/gethistory-chatbot/:thread_id/:bridge_slugName', chatBotAuth, common.getThreads);//Route Depricated //Public API for getting history for particular thread
router.get('/gethistory-chatbot/:thread_id/:bridge_slugName/:message_id', chatBotAuth, common.getMessageByMessageId);//Route Depricated //Public API for getting history for particular thread
router.post('/createapi/:bridge_id', middleware, createApi.createsApi); //vaisocket embed create api.
router.put('/:bridge_id', middleware, common.updateBridgeType);
router.get('/systemprompt/gethistory/:bridge_id/:timestamp', middleware, common.getSystemPromptHistory);
router.get('/getallsystemprompts/:bridge_id', middleware, common.getAllSystemPromptHistory); // Depricated
router.post('/getFineTuneData/:bridge_id', middleware, common.FineTuneData);
router.put('/gethistory/:bridge_id', middleware, common.updateThreadMessage);
router.put('/status/:status', chatBotAuth, common.updateMessageStatus);

router.put('/bridge-status/:bridge_id', middleware, common.bridgeArchive);
export default router;