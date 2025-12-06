import multer from 'multer';
import express from "express";
import { GetAllDocuments, create_vectors, delete_doc, updateDoc, getKnowledgeBaseToken, getEmebedToken, ragEmbedUserLogin } from "../controllers/rag.controller.js";
import { EmbeddecodeToken, middleware } from "../middlewares/middleware.js";
import bucketService from "../services/bucket.service.js";

// Initialize multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const routes = express.Router();

routes.route('/embed/login').get(EmbeddecodeToken, ragEmbedUserLogin);
routes.post('/', middleware, upload.single('file'), bucketService.handleFileUpload, create_vectors); // <-- Fix applied
routes.get('/docs', middleware, GetAllDocuments);
routes.delete('/docs/:id', middleware, delete_doc);
routes.patch('/docs/:id', middleware, updateDoc);
routes.get('/docs/token',middleware,getKnowledgeBaseToken)
routes.get('/get-emebed-token', middleware, getEmebedToken)

export default routes;
