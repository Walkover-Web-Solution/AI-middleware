import express from "express";
import { middleware } from "../middlewares/middleware.js";
import embedController from "../controllers/embed.controller.js";
import { GtwyEmbeddecodeToken } from "../middlewares/gtwyEmbedMiddleware.js";

const router = express.Router();

router.post('/login', GtwyEmbeddecodeToken, embedController.embedLogin);
router.post('/', middleware, embedController.createEmbed);
router.get('/', middleware, embedController.getAllEmbed);
router.put('/', middleware, embedController.updateEmbed);
router.get('/getToken', middleware, embedController.genrateToken);
router.get('/getAgents', GtwyEmbeddecodeToken, embedController.getEmbedDataByUserId);

export default router;