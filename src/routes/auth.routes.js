import express from "express";
import { createAuthToken, verifyAuthTokenController, saveAuthTokenInDbController, getAuthTokenInDbController, getClientInfoController } from "../controllers/auth.controller.js";
import { middleware } from "../middlewares/middleware.js";
import validate from "../middlewares/validate.middleware.js";
import authValidation from "../validation/joi_validation/auth.validation.js";

const router = express.Router();

router.get('/auth_token', middleware, createAuthToken);
router.post('/', middleware, validate(authValidation.saveAuthTokenInDb), saveAuthTokenInDbController);
router.get('/', middleware, getAuthTokenInDbController);
router.post('/verify', middleware, validate(authValidation.verifyAuthToken), verifyAuthTokenController);
router.get('/client_info', middleware, validate(authValidation.getClientInfo), getClientInfoController);

export default router;
