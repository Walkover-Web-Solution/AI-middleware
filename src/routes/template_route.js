import express from "express"
import { allTemplates, createTemplate } from "../controllers/templateController.js";
import { middleware } from "../middlewares/middleware.js";
const router = express.Router();

router.get('/all', allTemplates)
router.post('/:bridge_id',middleware, createTemplate)
router.get('/token',middleware,(req,res)=>{
 res.json({
    success:true,
    data:req.profile
 })   
})

export default router;