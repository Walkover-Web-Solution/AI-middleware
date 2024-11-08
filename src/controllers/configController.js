import express from "express";
import common from "../services/commonService/configServices.js";
import middleware from "../middlewares/middleware.js";
import { chatBotAuth } from "../middlewares/interfaceMiddlewares.js";
let router = express.Router();
router.get('/threads/:thread_id/:bridge_id', middleware, common.getThreads);
router.get('/history/:bridge_id', middleware, common.getMessageHistory);
router.delete('/deletebridges/:bridge_id', middleware, common.deleteBridges);
router.get('/gethistory/:thread_id/:bridge_id', middleware, common.getThreads); //Public API for getting history for particular thread
router.get('/gethistory-chatbot/:thread_id/:bridge_slugName', chatBotAuth, common.getThreads); //Public API for getting history for particular thread
router.get('/systemprompt/gethistory/:bridge_id/:timestamp', middleware, common.getSystemPromptHistory);
router.post('/getFineTuneData/:bridge_id', middleware, common.FineTuneData);
router.put('/gethistory/:bridge_id', middleware, common.updateThreadMessage);
router.put('/status/:status', chatBotAuth, common.updateMessageStatus);
router.put('/bridge-status/:bridge_id', middleware, common.bridgeArchive);
export default router;