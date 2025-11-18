import express from "express"
import {usopenai, openai, pinecone, uspinecone, saveToQdrant, queryQdrant} from "../controllers/pocController.js"
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/usopenai',usopenai)
router.get('/openai',openai)
router.get('/pinecone',pinecone)
router.get('/uspinecone',uspinecone)

// Qdrant DB POC Routes
// POST /poc/qdrant/save - Save PDF or DOCX file to Qdrant
router.post('/qdrant/save', upload.single('file'), saveToQdrant);

// POST /poc/qdrant/query - Query Qdrant for relevant data
router.post('/qdrant/query', queryQdrant);

export default router;