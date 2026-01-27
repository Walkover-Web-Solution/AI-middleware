import express from "express";
import promptWrapperController from "../controllers/promptWrapper.controller.js";
import { middleware } from "../middlewares/middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createPromptWrapperSchema,
  updatePromptWrapperSchema,
  promptWrapperIdSchema
} from "../validation/joi_validation/promptWrapper.validation.js";

const router = express.Router();

router.post("/", middleware, validate({ body: createPromptWrapperSchema }), promptWrapperController.createPromptWrapper);
router.get("/", middleware, promptWrapperController.getAllPromptWrappers);
router.get("/:wrapper_id", middleware, validate({ params: promptWrapperIdSchema }), promptWrapperController.getPromptWrapperById);
router.put(
  "/:wrapper_id",
  middleware,
  validate({ params: promptWrapperIdSchema, body: updatePromptWrapperSchema }),
  promptWrapperController.updatePromptWrapper
);
router.delete("/:wrapper_id", middleware, validate({ params: promptWrapperIdSchema }), promptWrapperController.deletePromptWrapper);

export default router;
