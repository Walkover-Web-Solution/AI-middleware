import express from "express";
import apikeyController from "../controllers/apikey.controller.js";
import {middleware} from "../middlewares/middleware.js";


let router = express.Router();

router.post('/', middleware, apikeyController.saveApikey);
router.get('/', middleware, apikeyController.getAllApikeys);
router.put('/:apikey_id',middleware, apikeyController.updateApikey);
router.delete('/',middleware, apikeyController.deleteApikey);

export default router;

