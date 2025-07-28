
import embeddings from '../services/langchainOpenai.js';
import { queryPinecone } from '../db_services/pineconeDbservice.js';
import rag_parent_data from '../db_services/rag_parent_data.js';
import queue from '../services/queue.js';
import configurationServices from '../db_services/ConfigurationServices.js';
import { genrateToken } from '../utils/ragUtils.js';
import { sendRagUpdates } from '../services/alertingService.js';
import { generateIdentifier } from '../services/utils/utilityService.js';
import { getOrganizationById, updateOrganizationData } from '../services/proxyService.js';
import token from "../services/commonService/generateToken.js";


const QUEUE_NAME = process.env.RAG_QUEUE || 'rag-queue';

export const GetAllDocuments = async (req, res, next) => {
    const { org, user, IsEmbedUser } = req.profile || {};
    const folder_id = req.profile.extraDetails?.folder_id;
    const user_id = req.profile?.user?.id;

    const embed = req.IsEmbedUser;
    const query = {org_id: org?.id}
    if(folder_id) query.folder_id = folder_id
    if(embed || IsEmbedUser) query.user_id = embed ? (user.id || user_id): null
    const result = await rag_parent_data.getAll(query);
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
        const folder_id = req.profile.extraDetails?.folder_id;
        const user_id = req.profile?.user?.id;
        const embed = req.IsEmbedUser;
        const {
            url,
            chunking_type = 'auto',
            chunk_size = 512,
            chunk_overlap = 70,
            name,
            description,
            docType,
            fileFormat, 
            nestedCrawling
        } = req.body;

        if (!name || !description) throw new Error('Name and Description are required!!');

        const parentData = (await rag_parent_data.create({
            source: {
                type: 'url',
                fileFormat,
                scriptId: fileFormat === 'script' ? new URL(url).pathname.split('/').pop() : undefined,
                data: {
                    url,
                    type :docType,
                },
                nesting: {
                    enabled: nestedCrawling
                }
            },
            chunking_type,
            chunk_size,
            chunk_overlap,
            name,
            description,
            user_id: embed ? (user.id || user_id) : null,
            org_id:  org?.id, 
            folder_id: folder_id,
        })).toObject();
        const payload = {
            event: fileFormat === 'script' ? 'load_multiple' : 'load',
            data: {
                url: url,
                resourceId: parentData._id,
            }
        }

        await queue.publishToQueue(QUEUE_NAME, payload);
        sendRagUpdates(org?.id, [parentData], 'create');
        res.status(201).json(parentData);

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const getKnowledgeBaseToken = async (req, res) => {
    const org_id =  req.profile.org.id
       let auth_token = generateIdentifier(14);
       const data = await getOrganizationById(org_id)
       
       if(!data?.meta?.accessKey) {
       auth_token= await updateOrganizationData(org_id,  {
           meta: {
             ...data?.meta,
             auth_token : auth_token,
           },
         },
       )
    auth_token = auth_token?.data?.company?.meta.auth_token
}
       
    const knowledgeBaseToken = token.generateToken({ payload: { org_id, user_id: req.profile.user.id, gtwyAIDocs:"true"}, accessKey: auth_token})
    return res.status(200).json({ result:  knowledgeBaseToken });
};
export const get_vectors_and_text = async (req, res, next) => {
    // TO DO: implement get_vectors_and_text logic
    const { doc_id, query, top_k = 3 } = req.body;
    const org_id = req.profile?.org?.id || "";
    if (!query) throw new Error("Query is required.");
    // Generate embedding

    const start = process.hrtime.bigint();
    const embedding = await embeddings.embedQuery(query);
    const embedTime = process.hrtime.bigint() - start;
    // Query Pinecone (using service)
    const start2 = process.hrtime.bigint();
    const queryResponseIds = await queryPinecone(embedding, org_id, doc_id, top_k);
    const queryTime = process.hrtime.bigint() - start2;
    console.log(`Embedding took ${Number(embedTime) / 1_000_000} ms`);
    console.log(`Query took ${Number(queryTime) / 1_000_000} ms`);
    

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
    // Remove doc id from configuration collections before deleting the document
    await configurationServices.removeDocIdFromConfigs(id, orgId);
    const result = await rag_parent_data.deleteDocumentById(id);
    const nestedDocs = await rag_parent_data.getDocumentsByQuery({ 'source.nesting.parentDocId': id });
    await rag_parent_data.deleteDocumentsByQuery({ 'source.nesting.parentDocId': id });
    for(const doc of [result, ...nestedDocs]){
        await queue.publishToQueue(QUEUE_NAME, { event: "delete", data: { resourceId: doc._id.toString(), orgId } });
    }
    sendRagUpdates(orgId, [result, ...nestedDocs], 'delete');
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
    const orgId = req.Embed ? req.Embed.org_id : req.profile.org.id;
    const result = await rag_parent_data.updateDocumentData(id, { name, description });
    sendRagUpdates(orgId, [result], 'update');
    res.locals = {
        "success": true,
        "message": `Document updated successfully`,
        "data": result
    }
    req.statusCode = 200;
    return next();
};

export const refreshDoc = async (req, res, next) => {
    const { id : docId } = req.params;
    const docData = await rag_parent_data.updateDocumentData(docId, { refreshedAt: new Date() });
    res.locals = {
        "success": true,
        "message": `Document refreshed successfully`,
        "data": docData
    }
    req.statusCode = 200;
    await queue.publishToQueue(QUEUE_NAME, { 
        event: 'load', 
        data: {
            url: docData.source.data.url, 
            resourceId: docId
        } 
    });
    return next();
};

export const getEmebedToken = async (req, res, next) => {
    const embed = req.Embed;
    const orgId = embed ? embed.org_id : req.profile.org.id;
    const token = await genrateToken(orgId);
    res.locals = {
        "success": true,
        "token": token
    }
    req.statusCode = 200;
    return next();
};