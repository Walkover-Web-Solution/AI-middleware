import express from "express";
import { middleware } from "../middlewares/middleware.js";
import {
  getModelInfoByServiceAndType,
  saveUserModelConfiguration,
  deleteUserModelConfiguration,
} from "../controllers/modelConfig.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  saveUserModelConfigurationBodySchema,
  deleteUserModelConfigurationQuerySchema,
  getModelInfoByServiceAndTypeQuerySchema,
} from "../validation/joi_validation/modelConfig.validation.js";

const router = express.Router();

router.get("/", middleware, validate({ query: getModelInfoByServiceAndTypeQuerySchema }), getModelInfoByServiceAndType);
router.post("/", middleware, validate({ body: saveUserModelConfigurationBodySchema }), saveUserModelConfiguration);
router.delete(
  "/",
  middleware,
  validate({ query: deleteUserModelConfigurationQuerySchema }),
  deleteUserModelConfiguration
);

export default router;
