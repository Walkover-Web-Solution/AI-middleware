import { deleteInCache, findInCache, scanCacheKeys } from "../cache_service/index.js";
import { AI_OPERATION_CONFIG } from "../configs/constant.js";
import { executeAiOperation } from "../services/utils/utility.service.js";
import { getKnowledgeBaseToken } from "./rag.controller.js";
import { createOrgToken } from "./chatBot.controller.js";
import embedController from "./embed.controller.js";

const clearRedisCache = async (req, res, next) => {
    const { id, ids } = req.body;

    // Handle single id or array of ids
    if (id || ids) {
        const identifiers = ids ? ids : id;
        await deleteInCache(identifiers);

        const message = Array.isArray(identifiers)
            ? `Redis Keys cleared successfully (${identifiers.length} keys)`
            : "Redis Key cleared successfully";

        res.locals = { message };
        req.statusCode = 200;
        return next();
    } else {
        // Clear all keys with prefix
        // scanCacheKeys('*') returns keys without prefix
        const keys = await scanCacheKeys('*');
        if (keys && keys.length > 0) {
            await deleteInCache(keys);
        }

        res.locals = { message: "Redis cleared successfully" };
        req.statusCode = 200;
        return next();
    }
};

const getRedisCache = async (req, res, next) => {
    const { id } = req.params;
    const result = await findInCache(id);
    res.locals = result;
    req.statusCode = 200;
    return next();
};


const callGtwy = async (req, res, next) => {
    const { type } = req.body;
    const org_id = req.profile?.org?.id;

    const config = AI_OPERATION_CONFIG[type];

    if (!config) {
        res.locals = { success: false, message: "Invalid type" };
        req.statusCode = 400;
        return next();
    }

    const result = await executeAiOperation(req, org_id, config);

    res.locals = result;
    req.statusCode = 200;
    return next();
};

const generateToken = async (req, res, next) => {
    const { type } = req.body;

    if (!type) {
        res.locals = { success: false, message: "Type parameter is required" };
        req.statusCode = 400;
        return next();
    }

    // Route to appropriate token generation function based on type
    switch (type.toLowerCase()) {
        case 'rag':
            return getKnowledgeBaseToken(req, res, next);
        
        case 'org':
            return createOrgToken(req, res, next);
        
        case 'embed':
            return embedController.genrateToken(req, res, next);
        
        default:
            res.locals = { success: false, message: `Invalid type: ${type}. Valid types are: knowledgebase, chatbot, embed` };
            req.statusCode = 400;
            return next();
    }
};

export default {
    clearRedisCache,
    getRedisCache,
    callGtwy,
    generateToken
};
