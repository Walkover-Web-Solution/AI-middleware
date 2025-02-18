import express from "express";
import { CreateAuthToken } from "../controllers/AuthController.js";
import {middleware} from "../middlewares/middleware.js";
const routes = express.Router();

routes.route('/auth_token').get(middleware, CreateAuthToken); 

export default routes;