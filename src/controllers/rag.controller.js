import rag_parent_data from '../db_services/ragParentData.service.js';
import queue from '../services/queue.service.js';
import { genrateToken } from '../utils/rag.utils.js';
import { sendRagUpdates } from '../services/alerting.service.js';
import { generateAuthToken, generateIdentifier } from '../services/utils/utility.service.js';
import { createProxyToken, getOrganizationById, updateOrganizationData } from '../services/proxy.service.js';
import token from "../services/commonService/generateToken.js";


const QUEUE_NAME = process.env.RAG_QUEUE || 'rag-queue';

export const ragEmbedUserLogin = async (req, res, next) => {
  const { name: embeduser_name, email: embeduser_email } = req.isGtwyUser ? {} : req.Embed;
  const Tokendata = {
    "user": {
      id: req.Embed.user_id,
      name: embeduser_name,
      email: embeduser_email,

    },
    "org": {
      id: req.Embed.org_id,
      name: req.Embed.org_name,

    },
    "extraDetails": {
      type: 'embed'
    }
  }
  const embedDetails = !req.isGtwyUser ?
    {
      user_id: req.Embed.user_id,
      company_id: req?.Embed?.org_id,
      company_name: req.Embed.org_name,
      tokenType: 'embed',
      embeduser_name, embeduser_email
    }
    : {
      company_id: req.company_id,
      company_name: req.company_name,
      user_id: req.user_id
    };
  await createProxyToken(embedDetails);
  const response = {
    ...(req?.Embed || {}),
    ...(req.Embed?.user_id ? { user_id: req.Embed.user_id } : {}),
    token: generateAuthToken(Tokendata.user, Tokendata.org, { "extraDetails": Tokendata.extraDetails }),
  };
  res.locals = { data: response, success: true };
  req.statusCode = 200;
  return next();
};

export const GetAllDocuments = async (req, res, next) => {
    const { org, user, IsEmbedUser } = req.profile || {};
    const folder_id = req.profile.extraDetails?.folder_id;
    const user_id = req.profile?.user?.id;

    const embed = req.IsEmbedUser;
    const query = { org_id: org?.id }
    if (folder_id) {
        query.folder_id = folder_id
    } else {
        query.$or = [
            { folder_id: "" },
            { folder_id: null },
            { folder_id: { $exists: false } }
        ]
    }
    if (embed || IsEmbedUser) query.user_id = embed ? (user.id || user_id) : null
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
export const delete_doc = async (req, res, next) => {
    const embed = req.Embed;
    const orgId = embed ? embed.org_id : req.profile.org.id;
    // const userId = req.profile.user.id;
    const { id } = req.params;
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
