import ModelsConfigModel from "../mongoModel/ModelConfigModel.js";


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


export default {
    getAllModelConfigs,
    saveModelConfig,
    getAllModelConfigsForService,
    deleteModelConfig
}

