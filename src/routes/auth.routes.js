import express from "express";
import { createAuthToken, verifyAuthTokenController, saveAuthTokenInDbController, getAuthTokenInDbController, getClientInfoController } from "../controllers/auth.controller.js";
import { middleware } from "../middlewares/middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { saveAuthTokenSchema, verifyAuthTokenSchema, getClientInfoSchema } from "../validation/joi_validation/auth.validation.js";

const routes = express.Router();

routes.route('/auth_token').get(middleware, createAuthToken);
routes.route('/').post(middleware, validate({ body: saveAuthTokenSchema }), saveAuthTokenInDbController);
routes.route('/').get(middleware, getAuthTokenInDbController);
routes.route('/verify').post(middleware, validate({ body: verifyAuthTokenSchema }), verifyAuthTokenController);
routes.route('/client_info').get(middleware, validate({ query: getClientInfoSchema }), getClientInfoController);

export default routes;
