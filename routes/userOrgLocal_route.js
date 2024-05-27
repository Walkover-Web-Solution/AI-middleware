import express from "express";
import { userOrgLocalToken, switchUserOrgLocal } from "../src/controllers/userOrgLocalController.js";
import middleware from "../src/middlewares/middleware.js";
const routes = express.Router();

routes.route('/localToken').post(userOrgLocalToken); 
routes.route('/switchOrg').post(middleware,switchUserOrgLocal); 

export default routes;