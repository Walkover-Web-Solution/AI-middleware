import apikeyService from "../db_services/apikey.service.js";
import Helper from "../services/utils/helper.js";
import { saveApikeySchema, updateApikeySchema, deleteApikeySchema } from "../validation/joi_validation/apikey.js";
import {findInCache,deleteInCache} from "../cache_service/index.js"
import { callOpenAIModelsApi, callGroqApi, callAnthropicApi, callOpenRouterApi, callMistralApi, callGeminiApi, callAiMlApi, callGrokApi } from "../services/utils/aiServices.js"
import { redis_keys,cost_types } from "../configs/constant.js";
import { cleanupCache } from "../services/utils/redisUtility.js";

const saveApikey = async(req, res, next) => {
    const {service, name, comment, apikey_limit = 0} = req.body;
    const org_id = req.profile?.org?.id;
    const folder_id = req.profile?.extraDetails?.folder_id;
    const user_id = req.profile.user.id;
    let apikey = req.body.apikey;

    // Validate request body
    await saveApikeySchema.validateAsync({
        apikey,
        service,
        name,
        comment,
        folder_id,
        user_id,
        apikey_limit
    });

    // Check API key validity
    const check = await checkApiKey(apikey, service);
    if(!check.success){
        res.locals = {
            success: false,
            error: check.error
        };
        req.statusCode = 400;
        return next();
    }

    // Encrypt API key
    apikey = await Helper.encrypt(apikey);
    const result = await apikeyService.saveApi({org_id, apikey, service, name, comment, folder_id, user_id, apikey_limit});
    
    // Mask API key for response
    const decryptedApiKey = await Helper.decrypt(apikey);
    const maskedApiKey = await Helper.maskApiKey(decryptedApiKey);
    result.api.apikey = maskedApiKey;

    if(result.success){
        res.locals = result;
        req.statusCode = 200;
        return next();
    } else {
        res.locals = {
            success: false,
            error: result.error
        };
        req.statusCode = 400;
        return next();
    }
}

const getAllApikeys = async(req, res, next) => {
    const org_id = req.profile?.org?.id;
    const folder_id = req.profile?.extraDetails?.folder_id;
    const user_id = req.profile.user.id;
    const isEmbedUser = req.IsEmbedUser;
    
    const result = await apikeyService.getAllApiKeyService(org_id, folder_id, user_id, isEmbedUser);
    
    if (result.success) {
        // Process all API keys in parallel for better performance
        const processedResults = await Promise.all(
            result.result.map(async (apiKeyObj) => {
                // Convert Mongoose document to plain object
                const plainObj = apiKeyObj.toObject ? apiKeyObj.toObject() : apiKeyObj;
                
                // Decrypt and mask the API key
                const decryptedApiKey = await Helper.decrypt(plainObj.apikey);
                const maskedApiKey = await Helper.maskApiKey(decryptedApiKey);
                
                // Get last used data from cache (runs in parallel)
                const lastUsedData = await findInCache(`${redis_keys.apikeylastused_}${plainObj._id}`);
                const cachedVal = await findInCache(`${redis_keys.apikeyusedcost_}${apiKeyObj._id}`);
                
                // Create the final object with all properties
                const processedObj = {
                    ...plainObj,
                    apikey: maskedApiKey
                };
                
                // Only add last_used if cache data exists
                if (lastUsedData) {
                    processedObj.last_used = JSON.parse(lastUsedData);
                }
                
                if(cachedVal){
                    let usagecost = JSON.parse(cachedVal);
                    processedObj.apikey_usage = usagecost?.usage_value;
                }
                
                return processedObj;
            })
        );
        
        // Update the result with processed data
        result.result = processedResults;
        res.locals = result;
        req.statusCode = 200;
        return next();
    } else {
        res.locals = {
            success: false,
            error: result.error
        };
        req.statusCode = 400;
        return next();
    }
}

const updateApikey = async(req, res, next) => {
    let apikey = req.body.apikey;
    const { name, comment, service, folder_id, user_id, apikey_limit = 0, apikey_usage = -1} = req.body;
    const { apikey_object_id } = req.params;
    
    // Validate request body and params
    const payload = {
        apikey,
        name,
        comment,
        service,
        apikey_object_id,
        folder_id,
        user_id,
        apikey_limit,
        ...(typeof apikey_usage !== 'undefined' && { apikey_usage }),
    };
    await updateApikeySchema.validateAsync(payload);
    
    // Check API key validity if provided
    if(apikey){
        const check = await checkApiKey(apikey, service);
        if(!check.success){
            res.locals = {
                success: false,
                error: check.error
            };
            req.statusCode = 400;
            return next();
        }
        apikey = await Helper.encrypt(apikey); 
    }
    
    const result = await apikeyService.updateApikey(apikey_object_id, apikey, name, service, comment, apikey_limit, apikey_usage);
    
    // Mask API key for response if updated
    let decryptedApiKey, maskedApiKey;
    if(apikey){
        decryptedApiKey = await Helper.decrypt(apikey);
        maskedApiKey = await Helper.maskApiKey(decryptedApiKey);
        result.apikey = maskedApiKey;
    }
    
    if (result.success) {
        // Clean up cache using the universal Redis utility for cost
        await cleanupCache(cost_types.apikey, apikey_object_id);
        if(apikey_usage == 0){
            await deleteInCache(`${redis_keys.apikeyusedcost_}${apikey_object_id}`);
        }
        res.locals = {
            success: true,
            message: "Apikey updated successfully",
            apikey: result?.apikey
        };
        req.statusCode = 200;
        return next();
    } else {
        res.locals = {
            success: false,
            message: 'No records updated or bridge not found'
        };
        req.statusCode = 400;
        return next();
    }
}

const deleteApikey = async(req, res, next) => {
    const body = req.body;
    const apikey_object_id = body.apikey_object_id;
    const org_id = req.profile.org.id;
    
    // Validate request body
    await deleteApikeySchema.validateAsync({
        apikey_object_id
    });
    
    const apikeys_data = await apikeyService.getApiKeyData(apikey_object_id);
    let version_ids = apikeys_data?.version_ids || [];
    const service = apikeys_data?.service;
    await apikeyService.getVersionsUsingId(version_ids, service);
    const result = await apikeyService.deleteApi(apikey_object_id, org_id);
    
    if (result.success) {
        await cleanupCache(cost_types.apikey, apikey_object_id);
        res.locals = {
            success: true,
            message: 'Apikey deleted successfully'
        };
        req.statusCode = 200;
        return next();
    } else {
        res.locals = {
            success: false,
            message: result.error
        };
        req.statusCode = 400;
        return next();
    }
}

const checkApiKey = async(apikey, service) => {
    let check;
    switch (service) {
        case 'openai':
            check = await callOpenAIModelsApi(apikey);
            break;
        case 'anthropic':
            check = await callAnthropicApi(apikey);
            break;
        case 'groq':
            check = await callGroqApi(apikey);
            break;
        case 'open_router':
            check = await callOpenRouterApi(apikey);
            break;
        case 'mistral':
            check = await callMistralApi(apikey);
            break;
        case 'gemini':
            check = await callGeminiApi(apikey);
            break;
        case 'ai_ml':
            check = await callAiMlApi(apikey);
            break;
        case 'grok':
            check = await callGrokApi(apikey);
            break;
        default:
            return { success: false, error: "Invalid service provided" };
    }
    
    if(!check.success){
        return { success: false, error: "invalid apikey or apikey is expired" };
    }
    return { success: true, data: check.data };
}

export default{
  saveApikey,
  getAllApikeys,
  deleteApikey,
  updateApikey
}

