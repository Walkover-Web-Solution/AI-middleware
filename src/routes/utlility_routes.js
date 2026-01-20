import express from "express";
// import {defaulResponseMigration} from "../controllers/utilityController.js"
import middleware from "../middlewares/middleware.js";
import extraThreadID from "../services/commonService/configServices.js";
const routes = express.Router();
// routes.route('/migration/createdefault-response-inorg').post(defaulResponseMigration);
routes.route("/externalReference").post(middleware, extraThreadID.extraThreadID);
export default routes;
