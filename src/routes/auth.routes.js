import express from "express";
import {
  createAuthToken,
  verifyAuthTokenController,
  saveAuthTokenInDbController,
  getAuthTokenInDbController,
  getClientInfoController,
} from "../controllers/auth.controller.js";
import { middleware } from "../middlewares/middleware.js";
import validate from "../middlewares/validate.middleware.js";
import authValidation from "../validation/joi_validation/auth.validation.js";
import logoutController from "../controllers/logout.controller.js";
import { scanCacheKeys } from "../cache_service/index.js";
const router = express.Router();

router.get("/auth_token", middleware, createAuthToken);
router.post("/", middleware, validate(authValidation.saveAuthTokenInDb), saveAuthTokenInDbController);
router.get("/", middleware, getAuthTokenInDbController);
router.post("/verify", middleware, validate(authValidation.verifyAuthToken), verifyAuthTokenController);
router.get("/client_info", middleware, validate(authValidation.getClientInfo), getClientInfoController);
router.post("/logout", middleware, logoutController.logout);

// Temporary test route
// router.get("/check-blacklist", middleware, async (req, res) => {
//   const { findInCache, scanCacheKeys } = await import("../cache_service/index.js");
//   const blacklistedTokens = await scanCacheKeys("blacklist:*");
//   res.json({
//     count: blacklistedTokens.length,
//     tokens: blacklistedTokens.map(t => t.substring(0, 50) + "...")
//   });
// });

// Temporary test route
router.get("/check-blacklist", async (req, res) => {
  const blacklistedTokens = await scanCacheKeys("blacklist:*");
  console.log("blacklistedTokens", blacklistedTokens);
  res.json({
    count: blacklistedTokens.length,
    tokens: blacklistedTokens.map((t) => t.substring(0, 50) + "..."),
  });
});

export default router;
