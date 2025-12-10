import express from "express";
import bridgeVersionController from "../controllers/bridgeVersion.controller.js";
import { updateBridgeController } from "../controllers/agentConfig.controller.js";
import { middleware } from "../middlewares/middleware.js";
import validate from "../middlewares/validate.middleware.js";
import bridgeVersionValidation from "../validation/joi_validation/bridgeVersion.validation.js";
import { updateBridgeSchema, bridgeIdParamSchema } from "../validation/joi_validation/agentConfig.validation.js";

const router = express.Router();

//create Version
router.post("/", middleware, validate(bridgeVersionValidation.createVersion), bridgeVersionController.createVersion);

//bulk publish
router.post("/bulk_publish", middleware, validate(bridgeVersionValidation.bulkPublishVersion), bridgeVersionController.bulkPublishVersion);

//get Version
router.get("/:version_id", middleware, validate(bridgeVersionValidation.getVersion), bridgeVersionController.getVersion);

//publish Version
router.post("/publish/:version_id", middleware, validate(bridgeVersionValidation.publishVersion), bridgeVersionController.publishVersion);

//delete Version
router.delete("/:version_id", middleware, validate(bridgeVersionValidation.removeVersion), bridgeVersionController.removeVersion);

//discard Version
router.post("/discard/:version_id", middleware, validate(bridgeVersionValidation.discardVersion), bridgeVersionController.discardVersion);

//suggest Model
router.get("/suggest-model/:version_id", middleware, validate(bridgeVersionValidation.suggestModel), bridgeVersionController.suggestModel);

//get Connected Agents
router.get("/connected-agents/:version_id", middleware, validate(bridgeVersionValidation.getConnectedAgents), bridgeVersionController.getConnectedAgents);

//update Version
router.put("/:version_id", middleware, validate(bridgeIdParamSchema), validate(updateBridgeSchema), updateBridgeController);

export default router;
