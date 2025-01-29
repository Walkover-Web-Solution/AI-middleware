import apiCall from "../db_services/apicallDbService.js";

// import helloService from '../db_services/helloService.js';
export const getOrgAndBridgesByFunctionId = async (req, res, next) => {
    const { scriptIds } = req.body;
    if(!Array.isArray(scriptIds))
        throw new Error("scriptIds is  not array")
    let functions = await apiCall.getAllScriptsByFunctionName(scriptIds)
    res.locals = {functions}
    req.statusCode = 200;
    return next();
}; 