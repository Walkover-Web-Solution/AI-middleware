import express from "express";
import { userOrgLocalToken, switchUserOrgLocal, updateUserDetails, removeUsersFromOrg } from "../controllers/userOrgLocal.controller.js";
import { middleware, loginAuth } from "../middlewares/middleware.js";
import validate from "../middlewares/validate.middleware.js";
import userOrgLocalValidation from "../validation/joi_validation/userOrgLocal.validation.js";

const routes = express.Router();

routes.route('/localToken').post(loginAuth, userOrgLocalToken);
routes.route('/switchOrg').post(middleware, validate(userOrgLocalValidation.switchUserOrgLocal), switchUserOrgLocal);
routes.route('/updateDetails').put(middleware, validate(userOrgLocalValidation.updateUserDetails), updateUserDetails);
routes.route('/deleteUser').delete(middleware, validate(userOrgLocalValidation.removeUsersFromOrg), removeUsersFromOrg);

export default routes;
