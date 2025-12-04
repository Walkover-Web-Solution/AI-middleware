import service from "../db_services/apiCall.service.js";
import { validateRequiredParams } from "../services/utils/apiCall.utils.js";

const getAllApiCalls = async (req, res, next) => {
    const org_id = req.profile?.org?.id;
    const folder_id = req.profile?.user?.folder_id || null;
    const user_id = req.profile?.user?.id;
    const isEmbedUser = req.IsEmbedUser;

    const functions = await service.getAllApiCallsByOrgId(org_id, folder_id, user_id, isEmbedUser);

    res.locals = {
        success: true,
        message: "Get all functions of a org successfully",
        data: functions,
        org_id: org_id
    };
    req.statusCode = 200;
    return next();
};

const updateApiCalls = async (req, res, next) => {
    const org_id = req.profile?.org?.id;
    const { function_id } = req.params;
    const body = req.body;
    let data_to_update = validateRequiredParams(body.dataToSend);

    if (!function_id || !data_to_update) {
        res.locals = {
            success: false,
            message: "Missing function_id or data to update"
        };
        req.statusCode = 400;
        return next();
    }

    const data = await service.getFunctionById(function_id);
    const old_fields = data.fields || {};

    data_to_update = {
        ...data_to_update,
        old_fields: old_fields,
        version: "v2"
    };

    const updated_function = await service.updateApiCallByFunctionId(org_id, function_id, data_to_update);

    res.locals = {
        success: true,
        data: updated_function.data
    };
    req.statusCode = 200;
    return next();
};

const deleteFunction = async (req, res, next) => {
    const org_id = req.profile?.org?.id;
    const { function_name } = req.body;

    if (!function_name) {
        res.locals = {
            success: false,
            message: "Missing function_name"
        };
        req.statusCode = 400;
        return next();
    }

    const result = await service.deleteFunctionFromApicallsDb(org_id, function_name);
    res.locals = result;
    req.statusCode = 200;
    return next();
};

export default {
    getAllApiCalls,
    updateApiCalls,
    deleteFunction
};
