import { findInCache, deleteInCache } from "../../cache_service/index.js";
import { redis_keys } from "../../configs/constant.js";

export async function cleanupCache(type, id) {
    try {
        const cacheKey = `${redis_keys[type + 'usedcost_']}${id}`;
        const cacheobject = await findInCache(cacheKey);
        const cachevalues = JSON.parse(cacheobject);
        let allcachekeys = [];
        if (cachevalues) {
            const versions = cachevalues.versions;
            const bridges = cachevalues.bridges;
            
            if (versions && versions.length > 0) {
                versions.forEach(version => {
                    allcachekeys.push(`${redis_keys.bridge_data_with_tools_}${version}`);
                    allcachekeys.push(`${redis_keys.get_bridge_data_}${version}`);
                });
            }
            if (bridges && bridges.length > 0) {
                bridges.forEach(bridge => {
                    allcachekeys.push(`${redis_keys.bridge_data_with_tools_}${bridge}`);
                    allcachekeys.push(`${redis_keys.get_bridge_data_}${bridge}`);
                });
            }
        }
        
        if (allcachekeys.length > 0) {
            await deleteInCache(allcachekeys);
            console.log(`Deleted ${allcachekeys.length} cache keys for ${type}: ${id}`);
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting cache:', error);
        return false;
    }
}