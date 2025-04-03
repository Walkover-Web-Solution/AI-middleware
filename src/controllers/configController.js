import express from "express";
import common from "../services/commonService/configServices.js";
import {middleware} from "../middlewares/middleware.js";
import { chatBotAuth } from "../middlewares/interfaceMiddlewares.js";
let router = express.Router();
router.get('/threads/:thread_id/:bridge_id', middleware, common.getThreads);
router.post('/threads/:thread_id/:bridge_id', middleware, common.createEntry);
router.get('/userfeedbackcount/:bridge_id',middleware,common.userFeedbackCount);
router.get('/history/:bridge_id', middleware, common.getMessageHistory);
router.get('/history/sub-thread/:thread_id', middleware, common.getAllSubThreadsController);
router.delete('/deletebridges/:bridge_id', middleware, common.deleteBridges);
router.get('/gethistory/:thread_id/:bridge_id', middleware, common.getThreads); //Public API for getting history for particular thread
router.get('/gethistory-chatbot/:thread_id/:bridge_slugName', chatBotAuth, common.getThreads);//Route Depricated //Public API for getting history for particular thread
router.get('/gethistory-chatbot/:thread_id/:bridge_slugName/:message_id', chatBotAuth, common.getMessageByMessageId);//Route Depricated //Public API for getting history for particular thread
router.delete('/deletebridges/:bridge_id', middleware, common.deleteBridges);
router.get('/gethistory/:thread_id/:bridge_id', middleware, common.getThreads); //Public API for getting history for particular thread
router.get('/gethistory-chatbot/:thread_id/:bridge_slugName', chatBotAuth, common.getThreads); //Public API for getting history for particular thread+
router.get('/systemprompt/gethistory/:bridge_id/:timestamp', middleware, common.getSystemPromptHistory);
router.post('/getFineTuneData/:bridge_id', middleware, common.FineTuneData);
router.put('/gethistory/:bridge_id', middleware, common.updateThreadMessage);
router.put('/status/:status', chatBotAuth, common.updateMessageStatus);
router.get('/get-message-history-chatbot/:thread_id/:bridge_slugName', chatBotAuth, common.getThreadMessages)
router.get('/get-message-history/:thread_id/:bridge_id', middleware, common.getThreadMessages)
router.put('/bridge-status/:bridge_id', middleware, common.bridgeArchive);
router.get('/getuserupdates/:version_id', middleware, common.getAllUserUpdates);
export default router;