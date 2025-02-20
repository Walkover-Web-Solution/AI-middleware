import ragDataModel from '../mongoModel/ragData.js';
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

async function remove(id,org_id) {
    const { chunks_id_array = [] } = await ragParentDataModel.findOne({
        '_id': id,
        'org_id': org_id
    }).select('chunks_id_array');
    await ragDataModel.deleteMany({ 'chunk_id': { $in: chunks_id_array } });
    const delete_doc = await ragParentDataModel.findByIdAndDelete(id);
    return {
        delete_doc,
        chunks_id_array
    }
}

/**
 * Get chunks from MongoDB based on chunk IDs
 * @param {Array} chunkIds - Array of chunk IDs
 * @returns {Array} - List of chunk documents
 */
async function getChunksByIds(chunkIds) {
    return await ragDataModel.find({ chunk_id: { $in: chunkIds } });
}

export default{
    getAll,
    create,
    update,
    remove,
    getChunksByIds
}
