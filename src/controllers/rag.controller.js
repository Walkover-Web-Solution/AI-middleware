import rag_parent_data from '../db_services/ragParentData.service.js';
import queue from '../services/queue.service.js';
import { genrateToken } from '../utils/rag.utils.js';
import { sendRagUpdates } from '../services/alerting.service.js';
import { generateAuthToken, generateIdentifier } from '../services/utils/utility.service.js';
import { createProxyToken, getOrganizationById, updateOrganizationData } from '../services/proxy.service.js';
import * as hippocampusService from '../services/hippocampus.service.js';
import ragCollectionService from '../db_services/ragCollection.service.js';


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

export const getAllDocuments = async (req, res, next) => {
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

export const createVectors = async (req, res, next) => {
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

    // Validation is now handled by middleware

    const parentData = (await rag_parent_data.create({
        source: {
            type: 'url',
            fileFormat,
            scriptId: fileFormat === 'script' ? new URL(url).pathname.split('/').pop() : undefined,
            data: {
                url,
                type: docType,
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
        org_id: org?.id,
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

    res.locals = {
        success: true,
        data: parentData
    };
    req.statusCode = 201;
    return next();
};

export const getKnowledgeBaseToken = async (req, res, next) => {
    const org_id = req.profile.org.id
    let auth_token = generateIdentifier(14);
    const data = await getOrganizationById(org_id)

    if (!data?.meta?.accessKey) {
        auth_token = await updateOrganizationData(org_id, {
            meta: {
                ...data?.meta,
                auth_token: auth_token,
            },
        },
        )
        auth_token = auth_token?.data?.company?.meta.auth_token
    }
    res.locals = {auth_token};
    req.statusCode = 200;
    return next();
};

export const deleteDoc = async (req, res, next) => {
    const embed = req.Embed;
    const orgId = embed ? embed.org_id : req.profile.org.id;
    // const userId = req.profile.user.id;
    const { id } = req.params;
    const result = await rag_parent_data.deleteDocumentById(id);
    const nestedDocs = await rag_parent_data.getDocumentsByQuery({ 'source.nesting.parentDocId': id });
    await rag_parent_data.deleteDocumentsByQuery({ 'source.nesting.parentDocId': id });
    for (const doc of [result, ...nestedDocs]) {
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
    const { id: docId } = req.params;
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

export const getEmbedToken = async (req, res, next) => {
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

export const createCollection = async (req, res, next) => {
    const { org } = req.profile || {};
    const { name, settings } = req.body;

    try {
        // Create collection in Hippocampus
        const hippocampusResponse = await hippocampusService.createCollection({
            name,
            settings
        });

        // Save collection data in MongoDB
        const collectionData = {
            collection_id: hippocampusResponse._id,
            name: hippocampusResponse.name,
            org_id: org?.id,
            resource_ids: [],
            settings: hippocampusResponse.settings,
            created_at: new Date(hippocampusResponse.createdAt),
            updated_at: new Date(hippocampusResponse.updatedAt)
        };

        const savedCollection = await ragCollectionService.create(collectionData);

        res.locals = {
            success: true,
            message: 'Collection created successfully',
            data: {
                ...hippocampusResponse,
                mongo_id: savedCollection._id
            }
        };
        req.statusCode = 201;
        return next();
    } catch (error) {
        console.error('Error creating collection:', error);
        res.locals = {
            success: false,
            message: error.response?.data?.message || 'Failed to create collection',
            error: error.message
        };
        req.statusCode = error.response?.status || 500;
        return next();
    }
};

export const createResourceInCollection = async (req, res, next) => {
    const { org } = req.profile || {};
    const { collectionId, title, ownerId, content, settings } = req.body;

    try {
        // Check if collection exists in our DB
        const collection = await ragCollectionService.getByCollectionId(collectionId);
        if (!collection) {
            res.locals = {
                success: false,
                message: 'Collection not found in database'
            };
            req.statusCode = 404;
            return next();
        }

        // Verify collection belongs to the organization
        if (collection.org_id !== org?.id) {
            res.locals = {
                success: false,
                message: 'Unauthorized access to collection'
            };
            req.statusCode = 403;
            return next();
        }

        // Create resource in Hippocampus
        const hippocampusResponse = await hippocampusService.createResource({
            collectionId,
            title,
            ownerId: ownerId || 'public',
            content,
            settings
        });

        // Add resource ID to collection in MongoDB
        await ragCollectionService.addResourceId(collectionId, hippocampusResponse._id);

        res.locals = {
            success: true,
            message: 'Resource created successfully',
            data: hippocampusResponse
        };
        req.statusCode = 201;
        return next();
    } catch (error) {
        console.error('Error creating resource:', error);
        res.locals = {
            success: false,
            message: error.response?.data?.message || 'Failed to create resource',
            error: error.message
        };
        req.statusCode = error.response?.status || 500;
        return next();
    }
};

export const getAllCollections = async (req, res, next) => {
    const { org } = req.profile || {};

    try {
        const collections = await ragCollectionService.getAllByOrgId(org?.id);
        res.locals = {
            success: true,
            message: 'Collections fetched successfully',
            data: collections
        };
        req.statusCode = 200;
        return next();
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.locals = {
            success: false,
            message: 'Failed to fetch collections',
            error: error.message
        };
        req.statusCode = 500;
        return next();
    }
};

export const getCollectionById = async (req, res, next) => {
    const { org } = req.profile || {};
    const { collectionId } = req.params;

    try {
        const collection = await ragCollectionService.getByCollectionId(collectionId);
        
        if (!collection) {
            res.locals = {
                success: false,
                message: 'Collection not found'
            };
            req.statusCode = 404;
            return next();
        }

        // Verify collection belongs to the organization
        if (collection.org_id !== org?.id) {
            res.locals = {
                success: false,
                message: 'Unauthorized access to collection'
            };
            req.statusCode = 403;
            return next();
        }

        res.locals = {
            success: true,
            message: 'Collection fetched successfully',
            data: collection
        };
        req.statusCode = 200;
        return next();
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.locals = {
            success: false,
            message: 'Failed to fetch collection',
            error: error.message
        };
        req.statusCode = 500;
        return next();
    }
};

export const deleteResourceFromCollection = async (req, res, next) => {
    const { org } = req.profile || {};
    const { id: resourceId } = req.params;

    try {
        // Find the collection that contains this resource
        const collection = await ragCollectionService.getCollectionByResourceId(resourceId);
        
        if (!collection) {
            res.locals = {
                success: false,
                message: 'Resource not found in any collection'
            };
            req.statusCode = 404;
            return next();
        }

        // Verify collection belongs to the organization
        if (collection.org_id !== org?.id) {
            res.locals = {
                success: false,
                message: 'Unauthorized access to resource'
            };
            req.statusCode = 403;
            return next();
        }

        // Delete resource from Hippocampus
        const hippocampusResponse = await hippocampusService.deleteResource(resourceId);

        // Remove resource ID from collection in MongoDB
        await ragCollectionService.removeResourceId(collection.collection_id, resourceId);

        res.locals = {
            success: true,
            message: 'Resource deleted successfully',
            data: hippocampusResponse
        };
        req.statusCode = 200;
        return next();
    } catch (error) {
        console.error('Error deleting resource:', error);
        res.locals = {
            success: false,
            message: error.response?.data?.message || 'Failed to delete resource',
            error: error.message
        };
        req.statusCode = error.response?.status || 500;
        return next();
    }
};

export const updateResourceInCollection = async (req, res, next) => {
    const { org } = req.profile || {};
    const { id: resourceId } = req.params;
    const { title, description, content, url } = req.body;

    try {
        // Find the collection that contains this resource
        const collection = await ragCollectionService.getCollectionByResourceId(resourceId);
        
        if (!collection) {
            res.locals = {
                success: false,
                message: 'Resource not found in any collection'
            };
            req.statusCode = 404;
            return next();
        }

        // Verify collection belongs to the organization
        if (collection.org_id !== org?.id) {
            res.locals = {
                success: false,
                message: 'Unauthorized access to resource'
            };
            req.statusCode = 403;
            return next();
        }

        // Prepare update data
        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (content) updateData.content = content;
        if (url) updateData.url = url;

        // Update resource in Hippocampus
        const hippocampusResponse = await hippocampusService.updateResource(resourceId, updateData);

        res.locals = {
            success: true,
            message: 'Resource updated successfully',
            data: hippocampusResponse
        };
        req.statusCode = 200;
        return next();
    } catch (error) {
        console.error('Error updating resource:', error);
        res.locals = {
            success: false,
            message: error.response?.data?.message || 'Failed to update resource',
            error: error.message
        };
        req.statusCode = error.response?.status || 500;
        return next();
    }
};

export const getResourceChunks = async (req, res, next) => {
    const { id: resourceId } = req.params;

    try {
        // Get chunks from Hippocampus
        const hippocampusResponse = await hippocampusService.getResourceChunks(resourceId);

        res.locals = {
            success: true,
            message: 'Resource chunks fetched successfully',
            data: hippocampusResponse
        };
        req.statusCode = 200;
        return next();
    } catch (error) {
        console.error('Error fetching resource chunks:', error);
        res.locals = {
            success: false,
            message: error.response?.data?.message || 'Failed to fetch resource chunks',
            error: error.message
        };
        req.statusCode = error.response?.status || 500;
        return next();
    }
};
