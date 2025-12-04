import express from "express";
import bridgeVersionController from "../controllers/bridgeVersionController.js";
import { updateBridgeController } from "../controllers/agentConfigController.js";
import { middleware } from "../middlewares/middleware.js";

const router = express.Router();

//create Version
router.post("/create", middleware, bridgeVersionController.createVersion);

//bulk publish
router.post("/bulk_publish", middleware, bridgeVersionController.bulkPublishVersion);

//get Version
router.get("/get/:version_id", middleware, bridgeVersionController.getVersion);

//publish Version
router.post("/publish/:version_id", middleware, bridgeVersionController.publishVersion);

//delete Version
router.delete("/:version_id", middleware, bridgeVersionController.removeVersion);

//discard Version
router.post("/discard/:version_id", middleware, bridgeVersionController.discardVersion);

//suggest Model
router.get("/suggest/:version_id", middleware, bridgeVersionController.suggestModel);

//get Connected Agents
router.get("/connected-agents/:version_id", middleware, bridgeVersionController.getConnectedAgents);

//update Version
router.put("/update/:version_id", middleware, updateBridgeController);

export default router;
