import express from "express";
import { middleware } from "../middlewares/middleware.js";
import embedController from "../controllers/embed.controller.js";
import { GtwyEmbeddecodeToken } from "../middlewares/gtwyEmbedMiddleware.js";
import validate from '../middlewares/validate.middleware.js';
import embedValidation from '../validation/joi_validation/embed.validation.js';

const router = express.Router();

router.post('/login', GtwyEmbeddecodeToken, embedController.embedLogin);
router.post('/', middleware, validate(embedValidation.createEmbed), embedController.createEmbed);
router.get('/', middleware, embedController.getAllEmbed);
router.put('/', middleware, validate(embedValidation.updateEmbed), embedController.updateEmbed);
router.get('/getToken', middleware, embedController.genrateToken);
router.get('/getAgents', GtwyEmbeddecodeToken, validate(embedValidation.getEmbedDataByUserId), embedController.getEmbedDataByUserId);

export default router;