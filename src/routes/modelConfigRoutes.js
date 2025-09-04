import express from "express";
import { middleware } from "../middlewares/middleware.js";
import { saveModelConfiguration, getAllModelConfig, getAllModelConfigForService, deleteModelConfiguration, saveUserModelConfiguration, deleteUserModelConfiguration ,updateModelConfiguration} from "../controllers/modelConfigController.js";

const router = express.Router();

router.get('/all', getAllModelConfig)
router.get('/', getAllModelConfigForService)
router.post('/', middleware, saveModelConfiguration)
router.post('/user', middleware, saveUserModelConfiguration)
router.delete('/', middleware, deleteModelConfiguration)
router.delete('/user', middleware, deleteUserModelConfiguration)
router.put('/', updateModelConfiguration)

export default router;