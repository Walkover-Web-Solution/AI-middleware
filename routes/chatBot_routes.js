const express = require('express');

const routes = express.Router();

// routes.route('/:projectId/interfaces').post(decodeToken, userOrgAccessCheck, createInterface);
// routes.route('/:projectId/interfaces/getAllInterfaces').get(decodeToken, userOrgAccessCheck, getAllInterfacesByProjectId);
// routes.route('/:projectId/interfaces/:interfaceId/update').put(decodeToken, userOrgAccessCheck, updateInterfaces);
// routes.route('/:projectId/interfaces/:interfaceId/updateAction').put(decodeToken, userOrgAccessCheck, updateInterfacesAction);
// routes.route('/:projectId/interfaces/:interfaceId/updateInterfaceDetails').put(decodeToken, userOrgAccessCheck, updateInterfaceDetails);
// routes.route('/:projectId/interfaces/:interfaceId').delete(decodeToken, userOrgAccessCheck, deleteByInterfaceId);
// routes.route('/:projectId/interfaces/:interfaceId/grid/:gridId').delete(decodeToken, userOrgAccessCheck, deleteComponent);
// routes.route('/:projectId/interfaces/:interfaceId/component/:componentId/action').put(decodeToken, userOrgAccessCheck, deleteActions);


routes.route('/').post(); // create chatbot
routes.route('/all').get(); // get all chatbot
routes.route('/getOneChatbot/:botId').get(); // get one chatbot
routes.route('/delete/:botId').delete(); // delete chatbot
routes.route('/update/:botId').put(); // update chatbot

module.exports = routes;
