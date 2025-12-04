import express from "express";
import { allTemplates } from "../controllers/template.controller.js";
import { middleware } from "../middlewares/middleware.js";

const router = express.Router();

router.get("/all", allTemplates);
router.get("/token", middleware, (req, res) => {
  res.json({
    success: true,
    data: req.profile,
  });
});

export default router;
