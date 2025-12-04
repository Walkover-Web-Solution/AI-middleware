import express from "express";
import common from "../services/commonService/configServices.js";
import { middleware } from "../middlewares/middleware.js";
import { chatBotAuth } from "../middlewares/interfaceMiddlewares.js";
import validate from '../middlewares/validate.middleware.js';
import conversationValidation from '../validation/joi_validation/conversation.validation.js';

let router = express.Router();

router.get('/threads/:thread_id/:bridge_id', middleware, validate(conversationValidation.getThreads), common.getThreads);
router.post('/threads/:thread_id/:bridge_id', middleware, validate(conversationValidation.createEntry), common.createEntry);
router.get('/userfeedbackcount/:bridge_id', middleware, validate(conversationValidation.userFeedbackCount), common.userFeedbackCount);
router.get('/history/:bridge_id', middleware, validate(conversationValidation.getMessageHistory), common.getMessageHistory);
router.get('/history/sub-thread/:thread_id', middleware, validate(conversationValidation.getAllSubThreadsController), common.getAllSubThreadsController);
router.delete('/deletebridges/:bridge_id', middleware, validate(conversationValidation.deleteBridges), common.deleteBridges);
router.get('/systemprompt/gethistory/:bridge_id/:timestamp', middleware, validate(conversationValidation.getSystemPromptHistory), common.getSystemPromptHistory);
router.post('/getFineTuneData/:bridge_id', middleware, validate(conversationValidation.FineTuneData), common.FineTuneData);
router.put('/gethistory/:bridge_id', middleware, validate(conversationValidation.updateThreadMessage), common.updateThreadMessage);
router.put('/status/:status', chatBotAuth, validate(conversationValidation.updateMessageStatus), common.updateMessageStatus);
router.get('/get-message-history/:thread_id/:bridge_id', middleware, validate(conversationValidation.getThreadMessages), common.getThreadMessages);
router.put('/bridge-status/:bridge_id', middleware, validate(conversationValidation.bridgeArchive), common.bridgeArchive);
router.get('/getuserupdates/:version_id', middleware, validate(conversationValidation.getAllUserUpdates), common.getAllUserUpdates);

export default router;
