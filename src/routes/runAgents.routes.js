import express from "express";
import runAgentsController from "../controllers/runAgents.controller.js";
import { middleware } from "../middlewares/middleware.js";
import { agentsAuth } from "../middlewares/agentsMiddlewares.js";
import validate from "../middlewares/validate.middleware.js";
import runAgentsValidation from "../validation/joi_validation/runAgents.validation.js";

const router = express.Router();

router.post("/public/login", validate(runAgentsValidation.loginPublicUser), runAgentsController.loginPublicUser);
router.post("/login", middleware, validate(runAgentsValidation.loginPublicUser), runAgentsController.loginPublicUser); // Using standard middleware for /login as per python code using jwt_middleware
router.get("/", agentsAuth, runAgentsController.getAllAgents);
router.get("/:slug_name", agentsAuth, validate(runAgentsValidation.getAgent), runAgentsController.getAgent);


export default router;
