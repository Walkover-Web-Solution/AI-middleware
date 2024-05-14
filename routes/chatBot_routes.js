<<<<<<< Updated upstream
const express = require('express');
=======
import express from 'express';
import { createChatBot, deleteChatBot, getAllChatBots, getOneChatBot, updateChatBot } from '../src/controllers/chatBotController.js';
>>>>>>> Stashed changes

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
routes.route('/all').get(getAllChatBots); // get all chatbot
routes.route('/getOneChatbot/:botId').get(getOneChatBot); // get one chatbot
routes.route('/delete/:botId').delete(deleteChatBot); // delete chatbot
routes.route('/update/:botId').put(updateChatBot); // update chatbot

module.exports = routes;
