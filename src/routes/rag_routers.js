import multer from 'multer';
import express from "express";
import { GetAllDocuments, create_vectors, delete_doc, updateDoc, getKnowledgeBaseToken } from "../controllers/RagController.js";
import { middleware } from "../middlewares/middleware.js";
import bucketService from "../services/BucketService.js";

// Initialize multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const routes = express.Router();

routes.post('/', middleware, upload.single('file'), bucketService.handleFileUpload, create_vectors); // <-- Fix applied
routes.get('/docs', middleware, GetAllDocuments);
routes.delete('/docs/:id', middleware, delete_doc);
routes.patch('/docs/:id', middleware, updateDoc);
routes.get('/docs/token',middleware,getKnowledgeBaseToken)

export default routes;
