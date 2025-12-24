import multer from 'multer';
import express from "express";
import { getAllDocuments, createVectors, deleteDoc, updateDoc, getEmbedToken, ragEmbedUserLogin } from "../controllers/rag.controller.js";
import { addResource, getResourcesByCollection, getResourceById, deleteResource, updateResource } from "../controllers/resource.controller.js";
import { createCollection, getAllCollections, getCollectionById, updateCollection } from "../controllers/collection.controller.js";
import { EmbeddecodeToken, middleware, checkAgentAccessMiddleware} from "../middlewares/middleware.js";
import bucketService from "../services/bucket.service.js";
import validate from "../middlewares/validate.middleware.js";
import { createVectorsSchema, docIdSchema, updateDocSchema } from "../validation/joi_validation/rag.validation.js";
import { addResourceSchema, resourceIdSchema, updateResourceSchema } from "../validation/joi_validation/resource.validation.js";
import { createCollectionSchema, getCollectionSchema, updateCollectionSchema } from "../validation/joi_validation/collection.validation.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf'];
    allowedMimes.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only PDF files are allowed'));
  },
});

const routes = express.Router();

routes.route('/embed/login').get(EmbeddecodeToken, ragEmbedUserLogin);
routes.post('/', middleware, checkAgentAccessMiddleware, upload.single('file'), bucketService.handleFileUpload, validate({ body: createVectorsSchema }), createVectors);
routes.get('/docs', middleware, getAllDocuments);
routes.delete('/docs/:id', middleware, checkAgentAccessMiddleware, validate({ params: docIdSchema }), deleteDoc);
routes.patch('/docs/:id', middleware, checkAgentAccessMiddleware, validate({ params: docIdSchema, body: updateDocSchema }), updateDoc);
routes.get('/get-emebed-token', middleware, getEmbedToken);

routes.post('/collection', middleware, validate({ body: createCollectionSchema }), createCollection);
routes.get('/collection', middleware, getAllCollections);
routes.get('/collection/:collection_id', middleware, validate({ params: getCollectionSchema }), getCollectionById);
routes.patch('/collection/:collection_id', middleware, validate({ params: getCollectionSchema, body: updateCollectionSchema }), updateCollection);

routes.post('/resource', middleware, upload.single('file'), validate({ body: addResourceSchema }), addResource);
routes.get('/collection/:collectionId/resources', middleware, getResourcesByCollection);
routes.get('/resource/:resourceId', middleware, validate({ params: resourceIdSchema }), getResourceById);
routes.put('/resource/:resourceId', middleware, express.json(), updateResource);
routes.put('/resource/:resourceId', middleware, express.json(), validate({ params: resourceIdSchema, body: updateResourceSchema }), updateResource);
routes.delete('/resource/:resourceId', middleware, validate({ params: resourceIdSchema }), deleteResource);

export default routes;
