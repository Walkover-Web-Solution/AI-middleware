const express = require('express');
const { createChatBot, getAllChatBots, getOneChatBot, deleteChatBot, updateChatBot, updateDetails, updateChatBotAction, updateChatBotResponse, createAllDefaultResponseInOrg, updateBridge, deleteBridge, addorRemoveResponseIdInBridge, sendMessageUsingChatBot, getChatBotOfBridge, getAllDefaultResponseInOrg } = require('../src/controllers/chatBotController');

const routes = express.Router();

routes.route('/').post(createChatBot); // create chatbot
routes.route('/:org_id/all').get(getAllChatBots); // get all chatbot
routes.route('/:botId').get(getOneChatBot); // get one chatbot
routes.route('/:botId').put(updateChatBot); // update chatbot
routes.route('/:botId/updateDetails').put(updateDetails); // update chatbot details
routes.route('/:botId/updateActions').put(updateChatBotAction); // update chatbot actions

routes.route('/:orgId/createResponse').post(createAllDefaultResponseInOrg) // TODO --- remove orgid from here and from middlware 
routes.route('/:orgId/getAllResponse').get(getAllDefaultResponseInOrg) // TODO --- remove orgid from here and from middlware; 

routes.route('/:orgId/:botId/bridge/:bridgeId').put(updateBridge); // update chatbot actions
routes.route('/:orgId/:botId/bridge/:bridgeId').delete(deleteBridge); // update chatbot actions
routes.route('/:botId').delete(deleteChatBot); // delete chatbot
routes.route('/:orgId/addresponseid/bridge/:bridgeId').post(addorRemoveResponseIdInBridge);
routes.route('/test').post(sendMessageUsingChatBot);
routes.route('/:orgId/:bridgeId').get(getChatBotOfBridge)
// routes.route('/:botId/bridge').delete(deleteBridge); // update chatbot actions

module.exports = routes;
