// const AlertingModel = require('../mongoModel/alertingModel');
import ragParentDataModel from '../mongoModel/rag_parent_data.js';


async function getAll(query){
    return await ragParentDataModel.find(query);
 }

async function create(data) {
    return await ragParentDataModel.create(data);
}

async function update(id, data) {
    return await ragParentDataModel.findByIdAndUpdate(id, data, { new: true });
}

async function remove(id) {
    return await ragParentDataModel.findByIdAndDelete(id);
}

export default{
    getAll,
    create,
    update,
    remove
}
