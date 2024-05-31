import express from "express";
import { metrics, getRequestData, getRequestDataForPg } from "../src/controllers/request_controller.js";
const routes = express.Router();
routes.route('/request/:id').get(getRequestData);
routes.route('/request/Pg/:id').get(getRequestDataForPg);
routes.route('/:org_id').get(metrics);
export default routes;