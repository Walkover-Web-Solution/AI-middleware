import ragDataModel from '../mongoModel/ragData.js';
import ragParentDataModel from '../mongoModel/rag_parent_data.js';



async function getAll(query){
    return await ragParentDataModel.find(query);
 }

async function create(data) {
    return await ragParentDataModel.create(data);
}

async function update(id, data) {
    return await ragParentDataModel.findByIdAndUpdate(id, data, { new: true }).lean();
}

async function removeChunksByDocId(docId) {
    return await ragDataModel.deleteMany({
        doc_id: docId 
    })
}

/**
 * Get chunks from MongoDB based on chunk IDs
 * @param {Array} chunkIds - Array of chunk IDs
 * @returns {Array} - List of chunk documents
 */
async function getChunksByIds(chunkIds) {
    return await ragDataModel.find({ _id: { $in: chunkIds } });
}

async function getDocumentById(docId) {
    return await ragParentDataModel.findById(docId).lean();
}

async function getDocumentsByQuery(query){
    return (await ragParentDataModel.find(query)).map(obj => obj.toObject());
}

async function updateDocumentByQuery(query, data){
    return await ragParentDataModel.findOneAndUpdate(query, data, { new: true });
}

async function updateDocumentsByQuery(query, data){
    return await ragParentDataModel.updateMany(query, data);
}

async function deleteDocumentById(docId) {
    return await ragParentDataModel.findOneAndDelete({_id:docId}).lean();
}

async function deleteDocumentsByQuery(query) {
    return await ragParentDataModel.deleteMany(query);
}

async function updateDocumentData(id , data) {
    return await ragParentDataModel.findOneAndUpdate({
        _id: id
    }, data, { new: true }).lean();
}

async function insertMany(data){
    return (await ragParentDataModel.insertMany(data)).map(obj => obj.toObject());
}

export default{
    getAll,
    create,
    update,
    removeChunksByDocId,
    getChunksByIds,
    getDocumentById,
    deleteDocumentById,
    updateDocumentData,
    insertMany, 
    getDocumentsByQuery, 
    updateDocumentsByQuery,
    updateDocumentByQuery, 
    deleteDocumentsByQuery
}
