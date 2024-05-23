import express from "express";
import { createUser, switchUser } from "../src/controllers/userController.js";
import middleware from "../middlewares/middleware.js";
const routes = express.Router();

routes.route('/login').post(createUser); 
routes.route('/switch').post(middleware,switchUser); 

export default routes;