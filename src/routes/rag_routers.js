import express from "express";
import { GetAllDocuments } from "../controllers/RagController.js";
import { EmbeddecodeToken} from "../middlewares/middleware.js";

const routes = express.Router();
routes.route('/all').get(EmbeddecodeToken, GetAllDocuments); // create chatbot

export default routes;