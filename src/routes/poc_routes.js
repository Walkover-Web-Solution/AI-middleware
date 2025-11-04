import express from "express"
import {usopenai, openai, pinecone, uspinecone} from "../controllers/pocController.js"
const router = express.Router();

router.get('/usopenai',usopenai)
router.get('/openai',openai)
router.get('/pinecone',pinecone)
router.get('/uspinecone',uspinecone)

export default router;