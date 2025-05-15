import express from "express";
import { saveModelCongiguration, getAllModelConfig, getAllModelConfigForService,updateModelConfiguration} from "../controllers/modelConfigController.js";
const router = express.Router();

router.get('/all', getAllModelConfig)
router.get('/', getAllModelConfigForService)
router.post('/', saveModelCongiguration)
router.put('/', updateModelConfiguration)
export default router;