
import embeddings from '../services/langchainOpenai.js';
import { queryPinecone } from '../db_services/pineconeDbservice.js';
import rag_parent_data from '../db_services/rag_parent_data.js';
import queue from '../services/queue.js';

const QUEUE_NAME = process.env.RAG_QUEUE || 'rag-queue';

export const GetAllDocuments = async (req, res, next) => {
    const { org, user } = req.profile || {};
    const embed = req.IsEmbedUser;
    const result = await rag_parent_data.getAll({
        user_id: embed ? user.id : null,
        org_id: org?.id
    });
    res.locals = {
        "success": true,
        "message": `Document fetched successfully`,
        "data": result
    };
    req.statusCode = 200;
    return next();
};

export const create_vectors = async (req, res) => {
    // TO DO: implement create_vectors logic
    try {
        const { org, user } = req.profile || {};
        const embed = req.IsEmbedUser;
        const {
            url,
            chunking_type = 'recursive',
            chunk_size = 512,
            chunk_overlap = 70,
            name,
            description,
            docType,
            fileFormat
        } = req.body;

        if (!name || !description) throw new Error('Name and Description are required!!');

        const parentData = await rag_parent_data.create({
            source: {
                type: 'url',
                fileFormat,
                data: {
                    url,
                    type :docType,
                }
            },
            chunking_type,
            chunk_size,
            chunk_overlap,
            name,
            description,
            user_id: embed ? user.id : null,
            org_id:  org?.id, 
        });
        const payload = {
            event: "load",
            data: {
                url: url,
                resourceId: parentData._id,
            }
        }

        await queue.publishToQueue(QUEUE_NAME, payload);

        res.status(201).json(parentData);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const get_vectors_and_text = async (req, res, next) => {
    // TO DO: implement get_vectors_and_text logic
    const { doc_id, query, top_k = 3 } = req.body;
    const org_id = req.profile?.org?.id || "";

    if (!query) throw new Error("Query is required.");
    // Generate embedding
    const embedding = await embeddings.embedQuery(query);
    // Query Pinecone (using service)
    const queryResponseIds = await queryPinecone(embedding, org_id, doc_id, top_k);

    // Query MongoDB using retrieved chunk IDs
    const mongoResults = await rag_parent_data.getChunksByIds(queryResponseIds)
    let text = mongoResults.map((result) => result.data).join("");

    res.locals = { text }
    req.statusCode = 200;
    return next();
};


export const delete_doc = async (req, res, next) => {
    const embed = req.Embed;
    const orgId = embed ? embed.org_id : req.profile.org.id;
    // const userId = req.profile.user.id;
    const { id } = req.params;
    const result = await rag_parent_data.deleteDocumentById(id);
    await queue.publishToQueue(QUEUE_NAME, { event: "delete", data: { resourceId: id, orgId } });

    res.locals = {
        "success": true,
        "message": `Document deleted successfully`,
        "data": result
    }
    req.statusCode = 200;
    return next();
};

export const updateDoc = async (req, res, next) => {
    // const userId = req.profile.user.id;
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await rag_parent_data.updateDocumentData(id, { name, description });

    res.locals = {
        "success": true,
        "message": `Document updated successfully`,
        "data": result
    }
    req.statusCode = 200;
    return next();
};

