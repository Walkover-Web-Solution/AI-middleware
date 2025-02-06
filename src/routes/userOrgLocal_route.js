import express from "express";
import { userOrgLocalToken, switchUserOrgLocal, updateUserDetails } from "../controllers/userOrgLocalController.js";
import {middleware} from "../middlewares/middleware.js";
const routes = express.Router();

routes.route('/localToken').post(userOrgLocalToken); 
routes.route('/switchOrg').post(middleware,switchUserOrgLocal); 
routes.route('/updateDetails').put(middleware,updateUserDetails)

export default routes;