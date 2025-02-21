import { ObjectId } from 'mongodb';
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

async function getDocumentById(docId) {
    return await ragParentDataModel.findById(docId);
}

async function deleteDocumentById(docId) {
    return await ragParentDataModel.findOneAndDelete({_id:docId});
}
async function updateDocumentData(id , data) {
    return await ragParentDataModel.findOneAndUpdate({
        _id: id
    }, data, { new: true });
}
export default{
    getAll,
    create,
    update,
    remove,
    getChunksByIds,
    getDocumentById,
    deleteDocumentById,
    updateDocumentData
}
