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

async function saveModelCongiguration(req,res, next) {
    const {configuration, inputConfig, outputConfig, service, model_name} = req.body;
    const data = {
        configuration,
        inputConfig,
        outputConfig,
        service,
        model_name
    }
    const result = await modelConfigDbService.saveModelConfig(data);
    res.locals = {
        success: true,
        result
    };
    req.statusCode = 200;
    return next();
}

async function updateModelConfiguration(req, res, next) {
        const { service, model_name, ...updateFields } = req.body;
        
        if (!service || !model_name) {
            req.statusCode = 400;
            res.locals = {
                success: false,
                message: "Service and model_name are required"
            };
            return next();
        }
        const result = await modelConfigDbService.updateModelConfig({
            service,
            model_name,
            ...updateFields  
        });

        res.locals = {
            success: true,
            result
        };
        req.statusCode = 200;
    
    return next();
}

export {
    getAllModelConfig,
    getAllModelConfigForService,
    saveModelCongiguration
    ,updateModelConfiguration
}