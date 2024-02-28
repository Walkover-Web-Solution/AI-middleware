const express = require('express')
const  {metrics,getRequestData} = require ('../src/controllers/request_controller.js');
const routes = express.Router();
routes.route('/request/:id').get(getRequestData);
routes.route('/:org_id').get( metrics);

module.exports = routes;