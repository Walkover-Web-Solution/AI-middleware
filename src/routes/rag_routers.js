import express from "express";
import { GetAllDocuments, create_vectors, get_vectors_and_text, delete_doc  } from "../controllers/RagController.js";
import { EmbeddecodeToken, middleware} from "../middlewares/middleware.js";

const routes = express.Router();
routes.route('/all').get(EmbeddecodeToken, GetAllDocuments); // create chatbot
routes.post('/', middleware, create_vectors);
routes.post('/query', middleware, get_vectors_and_text);
routes.get('/docs', middleware, GetAllDocuments);
routes.delete('/docs', middleware, delete_doc);

export default routes;