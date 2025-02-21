
import embeddings from '../services/langchainOpenai.js';
import { queryPinecone } from '../db_services/pineconeDbservice.js';
import rag_parent_data from '../db_services/rag_parent_data.js';
import queue from '../services/queue.js';

export const GetAllDocuments = async (req, res, next) => {
        const orgId = req.Embed.org_id;
        const userId = req.Embed.user_id;
        const result = await rag_parent_data.getAll({
            'org_id': orgId.toString(),
            'user_id': userId.toString()
        });
        res.locals = {result,orgId, userId}
        req.statusCode = 200;
        return next();
}; 

export const create_vectors = async (req, res, next) => {
    // TO DO: implement create_vectors logic
    try {
        const { org, user } = req.profile;
        const embed = req.embed;
        const {
          url,
          chunking_type = 'recursive',
          chunk_size= 512,
          chunk_overlap = 70,
          name,
          description, 
        } = req.body;

        if(!name || !description) throw new Error('Name and Description are required!!');

        const parentData = await rag_parent_data.create({ 
            source: {
                type: 'url', 
                data: {
                    url
                }
            },
            chunking_type, 
            chunk_size,
            chunk_overlap,
            name,
            description,
            user_id : embed ? user.id : null, 
            org_id : org.id
         });
         const payload = {
             event :"load",
             data :{
                url :url,
                resourceId : parentData._id,

            }
         }
        
        await queue.publishToQueue('rag-queue',payload );
         
        res.status(201).json(parentData);

    } catch (error) {
        next(error);
    }
    res.locals = {}
    req.statusCode = 200;
    return next();
};

export const get_vectors_and_text = async (req, res, next) => {
    // TO DO: implement get_vectors_and_text logic
    const { doc_id, query, top_k = 2 } = req.body;
    const org_id = req.profile?.org?.id || "";

    if (!query) throw new Error("Query is required.");
    // Generate embedding
    const embedding = await embeddings.embedQuery(query);
    // Query Pinecone (using service)
    const queryResponseIds = await queryPinecone(embedding, org_id, doc_id, top_k);

    // Query MongoDB using retrieved chunk IDs
    const mongoResults = await rag_parent_data.getChunksByIds(queryResponseIds)
    let text = mongoResults.map((result) => result.chunk).join("");

    res.locals = {text}
    req.statusCode = 200;
    return next();
};


export const delete_doc = async (req, res, next) => {
    const orgId = req.profile.org.id;
    const userId = req.profile.user.id;
    const result = await rag_parent_data.remove({
        'org_id': orgId.toString(),
        'user_id': userId.toString()
    });
    // TODO delete from pinecone
    res.locals = {
        "success": true,
        "message": `Deleted documents with chunk IDs: ${result.chunks_id_array}.`,
        "data": result.delete_doc
    }
    req.statusCode = 200;
    return next();
};

