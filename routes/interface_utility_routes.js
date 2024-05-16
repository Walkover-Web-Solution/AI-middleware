// import express from 'express';
// import { InterfaceAuth, InterfaceTokenDecode } from '../middlewares/interfaceMiddlewares.js';
// import { getInterfaceById, loadThirdPartyData, loginInterfaceUser, sendDataToAction } from '../src/controllers/interfaceController.js';

// const routes = express.Router();

// // // login interface user
// routes.route('/loginuser').post(InterfaceTokenDecode, loginInterfaceUser);
// routes.route('/:interfaceId/getoneinterface').get(InterfaceAuth, getInterfaceById);

// // // third party integration apis
// routes.route('/action/:actionId').post(InterfaceAuth, sendDataToAction);
// routes.route('/:interfaceId/getData').get(InterfaceAuth, loadThirdPartyData);

// export default routes;
