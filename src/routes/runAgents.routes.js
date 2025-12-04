import express from "express";
import runAgentsController from "../controllers/runAgents.controller.js";
import { middleware } from "../middlewares/middleware.js";
import { agentsAuth } from "../middlewares/agentsMiddlewares.js";

const router = express.Router();

router.post("/public/login", runAgentsController.loginPublicUser);
router.post("/login", middleware, runAgentsController.loginPublicUser); // Using standard middleware for /login as per python code using jwt_middleware
router.get("/all", agentsAuth, runAgentsController.getAllAgents);
router.get("/get-specific-agent/:slug_name", agentsAuth, runAgentsController.getAgent);


export default router;
