import express from "express";
import { middleware } from "../middlewares/middleware.js";
import { saveUserModelConfiguration, deleteUserModelConfiguration } from "../controllers/modelConfigController.js";

const router = express.Router();


router.post('/user', middleware, saveUserModelConfiguration)

router.delete('/user', middleware, deleteUserModelConfiguration)


export default router;