import express from "express";
import { importPostmanCollection,configDB } from "../controllers/configurePostmanCollection.js";
import { multerUploads } from '../middleware/multerMiddleware.js';
const routes = express.Router();

routes.post('/', multerUploads.single('avatar'), importPostmanCollection);
routes.get('/miragete/configrationDb', configDB);

export default routes;
