import express from "express";
import { CreateAuthToken, verify_auth_token_controller, save_auth_token_in_db_controller } from "../controllers/AuthController.js";
import {middleware} from "../middlewares/middleware.js";
const routes = express.Router();

routes.route('/auth_token').get(middleware, CreateAuthToken); 
routes.route('/').post(middleware, save_auth_token_in_db_controller);
routes.route('/verify').post(middleware, verify_auth_token_controller);

export default routes;