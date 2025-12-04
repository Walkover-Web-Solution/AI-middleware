import express from "express";
import service from "../controllers/apikey.controller.js";
import {middleware} from "../middlewares/middleware.js";


let router = express.Router();

router.post('/', middleware, service.saveApikey);
router.get('/', middleware, service.getAllApikeys);
router.put('/:apikey_object_id',middleware, service.updateApikey);
router.delete('/',middleware,service.deleteApikey);

export default router;

