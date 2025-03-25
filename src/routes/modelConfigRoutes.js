import express from "express";
import { saveModelCongiguration, getAllModelConfig, getAllModelConfigForService} from "../controllers/modelConfigController.js";
const router = express.Router();

router.get('/all', getAllModelConfig)
router.get('/', getAllModelConfigForService)
router.post('/', saveModelCongiguration)

export default router;