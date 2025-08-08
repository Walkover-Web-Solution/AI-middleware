import { modelConfigSchema, UserModelConfigSchema } from "../validation/joi_validation/modelConfigValidation.js";
import modelConfigDbService from "../db_services/modelConfigDbService.js"
const { validateModel } = await import('../services/utils/model_validation.js');
import ConfigurationServices from "../db_services/ConfigurationServices.js";

async function getAllModelConfigForService(req,res, next) {
    const service = req.query.service
    const result = await modelConfigDbService.getAllModelConfigsForService(service);
    res.locals = {
        success: true,
        result
    };
    req.statusCode = 200;
    return next();
}

async function getAllModelConfig(req,res, next) {
    const result = await modelConfigDbService.getAllModelConfigs();
    res.locals = {
        success: true,
        result
    };
    req.statusCode = 200;
    return next();
}

async function deleteModelConfiguration(req, res, next) {
    const { model_name, service } = req.query;

    if (!model_name || !service) {
        return res.status(400).json({ success: false, error: "model_name and service are required query parameters." });
    }
    
    const result = await modelConfigDbService.deleteModelConfig(model_name, service);

    if (!result) {
        return res.status(404).json({ success: false, message: "Model configuration not found." });
    }

    res.locals = {
        success: true,
        message: `Model configuration '${model_name}' for service '${service}' deleted successfully.`
    };
    req.statusCode = 200;
    return next();
}

async function saveModelCongiguration(req,res, next) {
    const { error, value } = modelConfigSchema.validate(req.body, { stripUnknown: true });
    if (error) {
        throw new Error(error.details[0].message);
    }

    const result = await modelConfigDbService.saveModelConfig(value);
    res.locals = {
        success: true,
        message: `Model configuration saved successfully`,
        result
    };
    req.statusCode = 200;
    return next();
}

async function saveUserModelCongiguration(req,res, next) {
    const org_id = req.profile.org.id;
    
    // Merge org_id with request body for validation
    const dataToValidate = { ...req.body, org_id };
    
    const { error, value } = UserModelConfigSchema.validate(dataToValidate);
    if (error) {
        throw new Error(error.details[0].message);
    }

    // check models validity and support
    const model_name = value.model_name;
    const service = value.service;
    const isModelSupported = await validateModel(service, model_name);
    
    if (!isModelSupported) {
        throw new Error(`Model '${model_name}' is not supported by service '${service}'`);
    }



    // Check if model with same service and model_name already exists for this org
    const modelExists = await modelConfigDbService.checkModelConfigExists(value.service, value.model_name);
    if (modelExists) {
        throw new Error(`Model configuration with service '${value.service}' and model_name '${value.model_name}' already exists`);
    }
    
    const result = await modelConfigDbService.saveModelConfig(value);
    res.locals = {
        success: true,
        message: `Model configuration saved successfully`,
        result
    };
    req.statusCode = 200;
    return next();
}

async function deleteUserModelConfiguration(req, res, next) {
    const { model_name, service } = req.query;
    const org_id = req.profile.org.id;

    if (!model_name || !service || !org_id) {
        return res.status(400).json({ success: false, error: "model_name, service, and org_id are required parameters." });
    }

    const usageCheck = await ConfigurationServices.findIdsByModelAndService(model_name, service, org_id);
    
    if (usageCheck.success && 
        (usageCheck.data.agents.length > 0 || usageCheck.data.versions.length > 0)) {
        // Model is in use, return error with details
        return res.status(409).json({ 
            success: false, 
            error: "Cannot delete model configuration as it is currently in use",
            usageDetails: usageCheck.data
        });
    }

    const result = await modelConfigDbService.deleteUserModelConfig(model_name, service, org_id);

    if (!result) {
        return res.status(404).json({ success: false, message: "Model configuration not found." });
    }

    res.locals = {
        success: true,
        message: `Model configuration '${model_name}' for service '${service}' deleted successfully.`
    };
    req.statusCode = 200;
    return next();
}


export {
    getAllModelConfig,
    getAllModelConfigForService,
    saveModelCongiguration,
    saveUserModelCongiguration,
    deleteUserModelConfiguration,
    deleteModelConfiguration
}