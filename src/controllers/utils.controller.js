import { deleteInCache, findInCache, scanCacheKeys } from "../cache_service/index.js";
import gptMemoryService from "../services/utils/gptMemory.service.js";

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

const callAi = async (req, res, next) => {
    const { type } = req.body;
    let result;

    switch (type) {
        case 'structured_output':
            result = await gptMemoryService.structuredOutputOptimizer(req);
            break;
        case 'gpt_memory':
            // For gpt_memory, parameters are in body now due to POST request
            const { bridge_id, thread_id, sub_thread_id, version_id } = req.body;
            result = await gptMemoryService.retrieveGptMemoryService({ bridge_id, thread_id, sub_thread_id, version_id });
            break;
        case 'improve_prompt':
            result = await gptMemoryService.improvePromptOptimizer(req);
            break;
        default:
            // Should be caught by validation, but safe fallback
            res.locals = { success: false, message: "Invalid type" };
            req.statusCode = 400;
            return next();
    }

    res.locals = result;
    req.statusCode = 200;
    return next();
};

export default {
    clearRedisCache,
    getRedisCache,
    callAi
};
