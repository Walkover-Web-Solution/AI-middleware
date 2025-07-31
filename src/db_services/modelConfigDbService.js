import ModelsConfigModel from "../mongoModel/ModelConfigModel.js";


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


export default {
    getAllModelConfigs,
    saveModelConfig,
    getAllModelConfigsForService,
    deleteModelConfig,
    deleteUserModelConfig,
    checkModelConfigExists,
    getModelConfigsByNameAndService
}

