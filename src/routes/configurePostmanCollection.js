import express from "express";
import { importPostmanCollection } from "../controllers/configurePostmanCollection.js";
import { multerUploads } from '../middleware/multerMiddleware.js';
const routes = express.Router();

routes.post('/', multerUploads.single('avatar'), importPostmanCollection);
export default routes;
