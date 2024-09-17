import express from "express";
import alertingContoller from "../controllers/alertingContoller.js";
import middleware from "../middlewares/middleware.js";
// import middleware from "../middlewares/middleware.js";

let router = express.Router();

router.post('/',middleware, alertingContoller.createAlert);
router.get('/', middleware, alertingContoller.getAllAlerts);
router.put('/:id',middleware, alertingContoller.updateAlert);
router.delete('/',middleware, alertingContoller.deleteAlert);

export default router;
