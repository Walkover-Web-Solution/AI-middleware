import express from "express";
import { userOrgLocalToken, switchUserOrgLocal, updateUserDetails, embedUser, removeUsersFromOrg } from "../controllers/userOrgLocalController.js";
import {middleware,EmbeddecodeToken} from "../middlewares/middleware.js";
const routes = express.Router();

routes.route('/localToken').post(userOrgLocalToken); 
routes.route('/switchOrg').post(middleware,switchUserOrgLocal); 
routes.route('/updateDetails').put(middleware,updateUserDetails)
routes.route('/embed/login').get(EmbeddecodeToken, embedUser);
routes.route('/register').get(EmbeddecodeToken, embedUser);
routes.route('/deleteUser').delete(middleware,removeUsersFromOrg);

export default routes;