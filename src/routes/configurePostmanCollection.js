import express from "express";
import { importPostmanCollection } from "../controllers/configurePostmanCollection.js";
import { multerUploads } from '../middleware/multerMiddleware.js';
const routes = express.Router();

routes.post('/:bridge_id',multerUploads.single('file'),importPostmanCollection);
export default routes;