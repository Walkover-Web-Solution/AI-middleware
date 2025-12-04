import express from "express";
import { userOrgLocalToken, switchUserOrgLocal, updateUserDetails, embedUser, removeUsersFromOrg } from "../controllers/userOrgLocal.controller.js";
import {middleware,EmbeddecodeToken,loginAuth} from "../middlewares/middleware.js";
const routes = express.Router();

routes.route('/localToken').post(loginAuth,userOrgLocalToken); 
routes.route('/switchOrg').post(middleware,switchUserOrgLocal); 
routes.route('/updateDetails').put(middleware,updateUserDetails)
routes.route('/embed/login').get(EmbeddecodeToken, embedUser);
routes.route('/deleteUser').delete(middleware,removeUsersFromOrg);

export default routes;
