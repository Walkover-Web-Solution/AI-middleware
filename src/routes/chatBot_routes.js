import express from "express";
import { addorRemoveBridgeInChatBot, addorRemoveResponseIdInBridge, createAllDefaultResponseInOrg, createChatBot, createOrRemoveAction, createOrgToken, getAllChatBots, getAllDefaultResponseInOrg, getChatBotOfBridge, getOneChatBot, getViewOnlyChatBot, loginUser, updateChatBot, updateChatBotConfig } from "../controllers/chatBotController.js";
import { chatBotAuth, combinedAuthWithChatBotTokenDecodeAndPublicChatbot } from "../middlewares/interfaceMiddlewares.js";
import { middleware } from "../middlewares/middleware.js";
import userOrgAccessCheck from "../middlewares/userOrgCheck.js";

const routes = express.Router();
routes.route('/').post(middleware, createChatBot); // create chatbot
routes.route('/:orgId/all').get(middleware, userOrgAccessCheck, getAllChatBots); // get all chatbot
routes.route('/:botId').get(middleware, getOneChatBot); // get one chatbot
routes.route('/:botId/getchatbot').get(chatBotAuth, getViewOnlyChatBot); // get one chatbot

routes.route('/:botId').put(middleware, updateChatBot); // update chatbot name

// routes.route('/:botId/updateActions').put(updateChatBotAction); // update chatbot actions

routes.route('/:orgId/createResponse').post(middleware, userOrgAccessCheck, createAllDefaultResponseInOrg) // TODO --- remove orgid from here and from middlware 

routes.route('/:orgId/getAllResponse').get(middleware, userOrgAccessCheck, getAllDefaultResponseInOrg) // TODO --- remove orgid from here and from middlware; 

// routes.route('/:orgId/:botId/bridge/:bridgeId').put(updateBridge); // update chatbot actions
// routes.route('/:orgId/:botId/bridge/:bridgeId').delete(deleteBridge); // update chatbot actions
routes.route('/:orgId/:botId/bridge/:bridgeId').put(middleware, userOrgAccessCheck, addorRemoveBridgeInChatBot); // update chatbot actions


routes.route('/:orgId/addresponseid/bridge/:bridgeId').post(middleware, userOrgAccessCheck, addorRemoveResponseIdInBridge); // done on frontend 
routes.route('/:orgId/:bridgeId').get(middleware, userOrgAccessCheck, getChatBotOfBridge) // get chatbot of bridge
routes.route('/loginuser').post([combinedAuthWithChatBotTokenDecodeAndPublicChatbot], loginUser)
routes.route('/:botId/updateconfig').post(middleware, updateChatBotConfig)
routes.route('/:orgId/createtoken').post(middleware, userOrgAccessCheck, createOrgToken)
// routes.route('/:botId/bridge').delete(deleteBridge); // update chatbot actions

routes.route('/:orgId/bridge/:bridgeId/action').post(middleware, createOrRemoveAction)
export default routes;