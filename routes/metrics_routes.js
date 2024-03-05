const express = require('express')
const  {metrics,getRequestData,getRequestDataForPg} = require ('../src/controllers/request_controller.js');
const routes = express.Router();
routes.route('/request/:id').get(getRequestData);
routes.route('/request/Pg/:id').get(getRequestDataForPg);
routes.route('/:org_id').get( metrics);

module.exports = routes;