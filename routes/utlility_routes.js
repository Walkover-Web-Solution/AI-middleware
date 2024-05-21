import express from "express";
import {defaulResponseMigration} from "../src/controllers/utilityController"
const routes = express.Router();
routes.route('/migration/createdefault-response-inorg').post(defaulResponseMigration); 
export default routes;