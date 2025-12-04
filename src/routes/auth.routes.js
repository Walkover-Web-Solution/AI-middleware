import express from "express";
import { CreateAuthToken, verify_auth_token_controller, save_auth_token_in_db_controller, get_auth_token_in_db_controller, get_client_info_controller } from "../controllers/auth.controller.js";
import {middleware} from "../middlewares/middleware.js";
const routes = express.Router();

routes.route('/auth_token').get(middleware, CreateAuthToken); 
routes.route('/').post(middleware, save_auth_token_in_db_controller);
routes.route('/').get(middleware, get_auth_token_in_db_controller);
routes.route('/verify').post(middleware, verify_auth_token_controller);
routes.route('/client_info').get(middleware, get_client_info_controller);

export default routes;
