import { findInCache, storeInCache } from "../../cache_service/index.js";
import { redis_keys, bridge_ids } from "../../configs/constant.js";
import axios from "axios";
import { callAiMiddleware } from "./aiCall.utils.js";
import prebuiltPromptDbService from "../../db_services/prebuiltPrompt.service.js";

const _deserializeCachedValue = (rawValue) => {
    if (!rawValue) return null;
    try {
        return JSON.parse(rawValue);
    } catch (e) {
        return rawValue;
    }
};

const _fetchMemoryFromCache = async (memoryId) => {
    const cachedValue = await findInCache(memoryId);
    return _deserializeCachedValue(cachedValue);
};

const _fetchMemoryFromRemote = async (memoryId) => {
    try {
        const response = await axios.post("https://flow.sokt.io/func/scriCJLHynCG", { threadID: memoryId });
        if (response.data) {
            await storeInCache(memoryId, JSON.stringify(response.data));
        }
        return response.data;
    } catch (error) {
        console.error(`Error fetching GPT memory from remote for ${memoryId}:`, error.message);
        return null;
    }
};

const _buildMemoryId = (threadId, subThreadId, bridgeId, versionId) => {
    const versionOrBridge = (versionId || bridgeId || '').trim();
    return `${threadId.trim()}_${subThreadId.trim()}_${versionOrBridge}`;
};

const getGptMemory = async (bridgeId, threadId, subThreadId, versionId) => {
    const memoryId = _buildMemoryId(threadId, subThreadId, bridgeId, versionId);
    let memory = await _fetchMemoryFromCache(memoryId);

    if (!memory) {
        memory = await _fetchMemoryFromRemote(memoryId);
    }

    return { memoryId, memory };
};

const retrieveGptMemoryService = async ({ bridge_id, thread_id, sub_thread_id, version_id }) => {
    const { memoryId, memory } = await getGptMemory(bridge_id, thread_id, sub_thread_id, version_id);
    return {
        bridge_id,
        thread_id,
        sub_thread_id,
        version_id,
        memory_id: memoryId,
        found: !!memory,
        memory
    };
};

const structuredOutputOptimizer = async (req) => {
    try {
        const { json_schema, query, thread_id } = req.body;
        const org_id = req.profile.org.id;
        const variables = { json_schema, query };
        const user = 'create the json shcmea accroding to the dummy json explained in system prompt.';

        let configuration = null;
        const updatedPrompt = await prebuiltPromptDbService.getSpecificPrebuiltPrompt(org_id, 'structured_output_optimizer');
        if (updatedPrompt && updatedPrompt.structured_output_optimizer) {
            configuration = { prompt: updatedPrompt.structured_output_optimizer };
        }

        const result = await callAiMiddleware(user, bridge_ids['structured_output_optimizer'], variables, configuration, thread_id);
        return result;
    } catch (error) {
        console.error("Error calling function structured_output_optimizer=>", error);
        return null;
    }
};

const improvePromptOptimizer = async (req) => {
    try {
        const { variables } = req.body;
        const user = 'improve the prompt';
        // Assuming bridge_ids['improve_prompt_optimizer'] exists. If not, need to check constant.js
        const result = await callAiMiddleware(user, bridge_ids['improve_prompt_optimizer'], variables);
        return result;
    } catch (error) {
        console.error('Error Calling function prompt optimise', error);
        return null;
    }
};

export default {
    retrieveGptMemoryService,
    structuredOutputOptimizer,
    improvePromptOptimizer
};
