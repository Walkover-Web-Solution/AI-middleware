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

async function updateModelConfig(updateData) {
    const { service, model_name, ...updateFields } = updateData;
    const existingConfig = await ModelsConfigModel.findOne({ service, model_name }).lean();
    if (!existingConfig) {
        throw new Error(`Model configuration not found for service: ${service} and model: ${model_name}`);
    }
    const flattenedUpdates = flattenObject(updateFields);

    const updateOperations = {};
    for (const path in flattenedUpdates) {
        const value = flattenedUpdates[path];
        if (value === false) {
            if (!updateOperations.$unset) updateOperations.$unset = {};
            updateOperations.$unset[path] = "";
        } else {
            if (!updateOperations.$set) updateOperations.$set = {};
            updateOperations.$set[path] = value;
        }
    }
    const result = await ModelsConfigModel.findOneAndUpdate(
        { service, model_name },
        updateOperations,
        { 
            new: true, 
            runValidators: true,
            strict: false 
        }
    ).lean();
    return {
        ...result,
        _id: result._id.toString(),
        id: result._id.toString()
    };
}

function flattenObject(obj, prefix = '') {
    const flattened = {};
    for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (obj[key] === false) {
            // Handle deletion markers
            flattened[newKey] = false;
        } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            // Recursively flatten nested objects
            Object.assign(flattened, flattenObject(obj[key], newKey));
        } else {
            // Directly assign primitives or arrays
            flattened[newKey] = obj[key];
        }
    }
    return flattened;
}

export default {
    getAllModelConfigs,
    saveModelConfig,
    getAllModelConfigsForService,
    updateModelConfig
}

