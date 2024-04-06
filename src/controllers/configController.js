const express = require('express');

const common=require("../services/commonService/configServices");
const middleware=require("../../middlewares/middleware");
let router = express.Router();


router.get('/getbridges/all',middleware,common.getAllBridges); //Done
router.get('/getbridges/:bridge_id',middleware,common.getBridges); //Done
router.get('/threads/:thread_id/:bridge_id',middleware,common.getThreads);
router.get('/history/:bridge_id',middleware,common.getMessageHistory);
router.get('/models/:service',middleware,common.getAIModels);  //Done
router.post('/createbridges',middleware,common.createBridges);  //Done
router.post('/updatebridges/:bridge_id',middleware,common.updateBridges);  //Done
router.put('/createbridges/:bridge_id', middleware, common.updateBridges);
router.delete('/deletebridges/:bridge_id',middleware,common.deleteBridges);
router.get('/gethistory/:thread_id/:bridge_id',middleware,common.getThreads);  //Public API for getting history for particular thread
module.exports = router;