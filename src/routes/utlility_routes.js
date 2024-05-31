import express from "express";
import {defaulResponseMigration} from "../controllers/utilityController.js"
const routes = express.Router();
routes.route('/migration/createdefault-response-inorg').post(defaulResponseMigration); 
export default routes;