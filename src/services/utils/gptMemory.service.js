import { findInCache, storeInCache } from "../../cache_service/index.js";
import axios from "axios";

const _deserializeCachedValue = (rawValue) => {
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue);
  } catch {
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
  const versionOrBridge = (versionId || bridgeId || "").trim();
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

export default {
  retrieveGptMemoryService
};
