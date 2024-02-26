const express = require('express');


const common = require('../services/commonService/common');
const middleware=require("../../middlewares/middleware");
// const completion=require('../services/commonService/completion');
let router = express.Router();

router.post('/chat/completion',middleware,common.prochat);
router.post('/playground/chat/completion',middleware,common.getchat);
router.post('/completion',middleware,common.proCompletion);
router.post('/playground/completion',middleware,common.getCompletion);
router.post('/embeddings',middleware,common.proEmbeddings);
router.post('/playground/embeddings',middleware,common.getEmbeddings);

module.exports = router;