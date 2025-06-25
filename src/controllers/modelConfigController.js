import { modelConfigSchema } from "../validation/joi_validation/modelConfigValidation.js";
import modelConfigDbService from "../db_services/modelConfigDbService.js"

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
    try {
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
    } catch (err) {
        next(err);
    }
}

async function saveModelCongiguration(req,res, next) {
    try {
        const { error, value } = modelConfigSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        }

        const result = await modelConfigDbService.saveModelConfig(value);
        res.locals = {
            success: true,
            message: `Model configuration saved successfully`,
            result
        };
        req.statusCode = 200;
        return next();
    } catch (err) {
        next(err);
    }
}


export {
    getAllModelConfig,
    getAllModelConfigForService,
    saveModelCongiguration,
    deleteModelConfiguration
}