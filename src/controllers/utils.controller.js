import { deleteInCache, findInCache, scanCacheKeys } from "../cache_service/index.js";
import gptMemoryService from "../services/utils/gptMemory.service.js";

const clearRedisCache = async (req, res, next) => {
    try {
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
    } catch (error) {
        console.error(`Error clearing cache: ${error}`);
        res.locals = { message: `Error clearing cache: ${error.message}` };
        req.statusCode = 500;
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

const structuredOutput = async (req, res, next) => {
    const result = await gptMemoryService.structuredOutputOptimizer(req);
    res.locals = result;
    req.statusCode = 200;
    return next();
};

const retrieveGptMemory = async (req, res, next) => {
    const { bridge_id, thread_id, sub_thread_id, version_id } = req.query;
    if (!bridge_id || !thread_id || !sub_thread_id) {
        return res.status(400).json({ success: false, message: "bridge_id, thread_id and sub_thread_id are required" });
    }
    const result = await gptMemoryService.retrieveGptMemoryService({ bridge_id, thread_id, sub_thread_id, version_id });
    res.locals = result;
    req.statusCode = 200;
    return next();
};

const improvePrompt = async (req, res, next) => {
    const result = await gptMemoryService.improvePromptOptimizer(req);
    res.locals = result;
    req.statusCode = 200;
    return next();
};

export default {
    clearRedisCache,
    getRedisCache,
    structuredOutput,
    retrieveGptMemory,
    improvePrompt
};
