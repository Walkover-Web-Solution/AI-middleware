const express = require('express');
const AlertingController = require('../controllers/alertingController');
import middleware from "../middlewares/middleware.js";

const router = express.Router();

router.use(middleware); // Apply auth middleware to all routes

router.post('/', AlertingController.createAlert);
router.get('/:alertId', AlertingController.getAlert);
router.put('/:alertId', AlertingController.updateAlert);
router.delete('/:alertId', AlertingController.deleteAlert);
router.get('/', AlertingController.getAllAlerts);
router.get('/byType', AlertingController.getAlertsByType);
router.get('/byBridge', AlertingController.getAlertsByBridge);

module.exports = router;
