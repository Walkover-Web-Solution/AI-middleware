import multer from 'multer';
import express from "express";
import { getAllDocuments, createVectors, deleteDoc, updateDoc, getEmbedToken, ragEmbedUserLogin, searchKnowledge, createCollection, getAllCollections, getCollectionById, createResourceInCollection, updateResourceInCollection, deleteResourceFromCollection, getResourceChunks, getAllResourcesByCollectionId } from "../controllers/rag.controller.js";
import { EmbeddecodeToken, middleware, checkAgentAccessMiddleware } from "../middlewares/middleware.js";
import bucketService from "../services/bucket.service.js";
import validate from "../middlewares/validate.middleware.js";
import { createVectorsSchema, docIdSchema, updateDocSchema, searchSchema, createCollectionSchema, collectionIdSchema, createResourceSchema, resourceIdSchema, updateResourceSchema } from "../validation/joi_validation/rag.validation.js";

// Initialize multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

const routes = express.Router();

routes.route('/embed/login').get(EmbeddecodeToken, ragEmbedUserLogin);
routes.post('/', middleware, checkAgentAccessMiddleware, upload.single('file'), bucketService.handleFileUpload, validate({ body: createVectorsSchema }), createVectors);
routes.get('/docs', middleware, getAllDocuments);
routes.delete('/docs/:id', middleware, checkAgentAccessMiddleware, validate({ params: docIdSchema }), deleteDoc);
routes.patch('/docs/:id', middleware, checkAgentAccessMiddleware, validate({ params: docIdSchema, body: updateDocSchema }), updateDoc);
routes.get('/get-emebed-token', middleware, getEmbedToken);
routes.post('/chatbot/search', middleware, validate({ body: searchSchema }), searchKnowledge);

// Collection routes
routes.post('/collection', middleware, checkAgentAccessMiddleware, validate({ body: createCollectionSchema }), createCollection);
routes.get('/collections', middleware, getAllCollections);
routes.get('/collection/:collectionId', middleware, validate({ params: collectionIdSchema }), getCollectionById);
routes.get('/collection/:collectionId/resources', middleware, validate({ params: collectionIdSchema }), getAllResourcesByCollectionId);

// Resource routes
routes.post('/resource', middleware, checkAgentAccessMiddleware, validate({ body: createResourceSchema }), createResourceInCollection);
routes.put('/resource/:id', middleware, checkAgentAccessMiddleware, validate({ params: resourceIdSchema, body: updateResourceSchema }), updateResourceInCollection);
routes.delete('/resource/:id', middleware, checkAgentAccessMiddleware, validate({ params: resourceIdSchema }), deleteResourceFromCollection);
routes.get('/resource/:id/chunks', middleware, checkAgentAccessMiddleware, validate({ params: resourceIdSchema }), getResourceChunks);

export default routes;
