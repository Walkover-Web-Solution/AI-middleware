import multer from 'multer';
import express from "express";
import { GetAllDocuments, create_vectors, get_vectors_and_text, delete_doc, updateDoc, refreshDoc } from "../controllers/RagController.js";
import { EmbeddecodeToken, middleware } from "../middlewares/middleware.js";
import bucketService from "../services/BucketService.js";

// Initialize multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const routes = express.Router();

routes.route('/all').get(EmbeddecodeToken, GetAllDocuments);

routes.post('/', middleware, upload.single('file'), bucketService.handleFileUpload, create_vectors); // <-- Fix applied
routes.post('/query', middleware, get_vectors_and_text);
routes.get('/docs', middleware, GetAllDocuments);
routes.delete('/docs/:id', middleware, delete_doc);
routes.patch('/docs/:id', middleware, updateDoc);
routes.patch('/docs/:id/refresh', middleware, refreshDoc);

export default routes;
