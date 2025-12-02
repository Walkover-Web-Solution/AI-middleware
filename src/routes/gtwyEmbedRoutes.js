import express from "express";
import { createEmbed, genrateToken, getAllEmbed, getEmbedDataByUserId, updateEmbed } from "../controllers/gtwyEmbedController.js";
import { middleware } from "../middlewares/middleware.js";
import { GtwyEmbeddecodeToken } from "../middlewares/gtwyEmbedMiddleware.js";

const routes = express.Router();

routes.route('/').post(middleware, createEmbed);
routes.route('/').get(middleware, getAllEmbed);
routes.route('/').put(middleware, updateEmbed);
routes.route('/token').get(middleware, genrateToken);
routes.route('/getAgents').get(GtwyEmbeddecodeToken, getEmbedDataByUserId);

export default routes;
