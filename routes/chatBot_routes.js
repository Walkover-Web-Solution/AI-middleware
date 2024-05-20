import express from "express";
import { createChatBot, getAllChatBots, getOneChatBot, deleteChatBot, updateChatBot, updateDetails, updateChatBotAction, createAllDefaultResponseInOrg, updateBridge, deleteBridge, addorRemoveResponseIdInBridge, sendMessageUsingChatBot, getChatBotOfBridge } from "../src/controllers/chatBotController.js";
import middleware from "../middlewares/middleware.js";
const routes = express.Router();
routes.route('/:org_id').post(middleware,createChatBot); // create chatbot
routes.route('/:org_id/all').get(middleware,getAllChatBots); // get all chatbot
routes.route('/:botId').get(middleware,getOneChatBot); // get one chatbot
routes.route('/:botId').put(middleware,updateChatBot); // update chatbot
routes.route('/:botId/updateDetails').put(middleware,updateDetails); // update chatbot details
routes.route('/:botId/updateActions').put(middleware,updateChatBotAction); // update chatbot actions
routes.route('/:orgId/createResponse').post(middleware,createAllDefaultResponseInOrg); // TODO --- remove orgid from here and from middlware 
routes.route('/:orgId/:botId/bridge/:bridgeId').put(middleware,updateBridge); // update chatbot actions
routes.route('/:orgId/:botId/bridge/:bridgeId').delete(middleware,deleteBridge); // update chatbot actions
routes.route('/:botId').delete(middleware,deleteChatBot); // delete chatbot
routes.route('/:orgId/addresponseid/bridge/:bridgeId').post(middleware,addorRemoveResponseIdInBridge); // delete chatbot
routes.route('/test').post(middleware,sendMessageUsingChatBot);//  
routes.route('/:orgId/:bridgeId').get(middleware,getChatBotOfBridge);
// routes.route('/:botId/bridge').delete(deleteBridge); // update chatbot actions
export default routes;