import ModelsConfigModel from "../mongoModel/ModelConfigModel.js";

async function checkModel(model_name, service){
    //function to check if a model configuration exists 
    const existingConfig = await ModelsConfigModel.findOne({ model_name, service });
    if (!existingConfig) {
        return false;
    }
    return true;
}

async function checkModelConfigExists(service, model_name) {
    const query = { service, model_name };
    
    const existingConfig = await ModelsConfigModel.findOne(query).lean();
    return existingConfig ? true : false;
}

async function getAllModelConfigsForService(service) {
    const modelConfigs = await ModelsConfigModel.find({ 'service': service }).lean();
    return modelConfigs.map(mc => ({ ...mc, _id: mc._id.toString() }));
}

async function getAllModelConfigs() {
    const modelConfigs = await ModelsConfigModel.find().lean();
    return modelConfigs.map(mc => ({ ...mc, _id: mc._id.toString() }));
}

async function saveModelConfig(modelConfigData) {
    const newModelConfig = new ModelsConfigModel(modelConfigData);
    const result = await newModelConfig.save();
    return { id: result._id.toString(), ...modelConfigData };
}

async function deleteModelConfig(model_name, service) {
    const result = await ModelsConfigModel.findOneAndDelete({ model_name, service });
    return result;
}

async function deleteUserModelConfig(model_name, service, org_id) {
    const result = await ModelsConfigModel.findOneAndDelete({ model_name, service, org_id });
    return result;
}

async function getModelConfigsByNameAndService(model_name, service) {
    const modelConfigs = await ModelsConfigModel.find({ model_name, service }).lean();
    return modelConfigs.map(mc => ({ ...mc, _id: mc._id.toString() }));
}

async function updateModelConfigs(model_name, service, updates) {
    //function to update provided model parameters    

    // Convert updates to dot notation for configuration
    const setObject = {};
    for (const key in updates) {
        setObject[`configuration.${key}`] = updates[key];
    }

    // Perform direct DB update
    const result = await ModelsConfigModel.updateOne(
        { model_name, service },
        { $set: setObject }
    );

    return result.modifiedCount > 0;
}

export default {
    getAllModelConfigs,
    saveModelConfig,
    getAllModelConfigsForService,
    deleteModelConfig,
    deleteUserModelConfig,
    checkModelConfigExists,
    getModelConfigsByNameAndService,
    checkModel,
    updateModelConfigs
}

