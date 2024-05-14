const express = require('express');
const { createChatBot, getAllChatBots, getOneChatBot, deleteChatBot, updateChatBot, updateDetails, updateChatBotAction, updateChatBotResponse } = require('../src/controllers/chatBotController');

const routes = express.Router();

// routes.route('/:projectId/interfaces').post(decodeToken, userOrgAccessCheck, createInterface);
// routes.route('/:projectId/interfaces/getAllInterfaces').get(decodeToken, userOrgAccessCheck, getAllInterfacesByProjectId);
// routes.route('/:projectId/interfaces/:interfaceId/update').put(decodeToken, userOrgAccessCheck, updateInterfaces);
// routes.route('/:projectId/interfaces/:interfaceId/updateAction').put(decodeToken, userOrgAccessCheck, updateInterfacesAction);
// routes.route('/:projectId/interfaces/:interfaceId/updateInterfaceDetails').put(decodeToken, userOrgAccessCheck, updateInterfaceDetails);
// routes.route('/:projectId/interfaces/:interfaceId').delete(decodeToken, userOrgAccessCheck, deleteByInterfaceId);
// routes.route('/:projectId/interfaces/:interfaceId/grid/:gridId').delete(decodeToken, userOrgAccessCheck, deleteComponent);
// routes.route('/:projectId/interfaces/:interfaceId/component/:componentId/action').put(decodeToken, userOrgAccessCheck, deleteActions);


routes.route('/').post(createChatBot); // create chatbot
routes.route('/:org_id/all').get(getAllChatBots); // get all chatbot
routes.route('/:botId').get(getOneChatBot); // get one chatbot
routes.route('/:botId').delete(deleteChatBot); // delete chatbot
routes.route('/:botId').put(updateChatBot); // update chatbot
routes.route('/:botId/updateDetails').put(updateDetails); // update chatbot details
routes.route('/:botId/updateActions').put(updateChatBotAction); // update chatbot actions
routes.route('/:botId/updateResponse').put(updateChatBotResponse); // update chatbot actions

module.exports = routes;
