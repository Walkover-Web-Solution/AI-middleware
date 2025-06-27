import express from "express";
import { saveModelCongiguration, getAllModelConfig, getAllModelConfigForService, deleteModelConfiguration} from "../controllers/modelConfigController.js";
const router = express.Router();

router.get('/all', getAllModelConfig)
router.get('/', getAllModelConfigForService)
router.post('/', saveModelCongiguration)
router.delete('/', deleteModelConfiguration)

export default router;