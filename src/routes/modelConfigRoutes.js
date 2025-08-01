import express from "express";
import { middleware } from "../middlewares/middleware.js";
import { saveModelCongiguration, getAllModelConfig, getAllModelConfigForService, deleteModelConfiguration, saveUserModelCongiguration, deleteUserModelConfiguration } from "../controllers/modelConfigController.js";
const router = express.Router();

router.get('/all', getAllModelConfig)
router.get('/', getAllModelConfigForService)
router.post('/', middleware, saveModelCongiguration)
router.post('/user', middleware, saveUserModelCongiguration)
router.delete('/', middleware, deleteModelConfiguration)
router.delete('/user', middleware, deleteUserModelConfiguration)

export default router;