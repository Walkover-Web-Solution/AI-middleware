import express from "express";
import { importPostmanCollection,updteMaxtoken } from "../controllers/configurePostmanCollection.js";
import { multerUploads } from '../middleware/multerMiddleware.js';
const routes = express.Router();

routes.post('/', multerUploads.single('avatar'), importPostmanCollection);
routes.get('/miragete/configrationDb', updteMaxtoken);

export default routes;
