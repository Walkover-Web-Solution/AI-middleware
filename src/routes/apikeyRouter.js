import express from "express";
import service from "../services/commonService/apiKeyService.js";
import middleware from "../middlewares/middleware.js";


let router = express.Router();

router.post('/save', middleware, service.saveApikey);
router.get('/getall/api', middleware, service.getAllApikeys);

export default router;