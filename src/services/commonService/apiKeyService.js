import apikeySaveService from "../../db_services/apikeySaveService.js";
import Helper from "../utils/helper.js";
import { saveApikeySchema, updateApikeySchema, deleteApikeySchema } from "../../validation/joi_validation/apikey.js";
import {deleteInCache} from "../../cache_service/index.js"
import { callOpenAIModelsApi, callGroqApi, callAnthropicApi, callOpenRouterApi, callMistralApi, callGeminiApi, callAiMlApi } from "../utils/aiServices.js"

const saveApikey = async(req,res) => {
    try {
        const {service, name, comment} = req.body;
        const org_id = req.profile?.org?.id;
        const folder_id = req.profile?.extraDetails?.folder_id;
        const user_id = req.profile.user.id
        let apikey = req.body.apikey
        try{
            await saveApikeySchema.validateAsync({
                apikey,
                service,
                name,
                comment,
                folder_id,
                user_id
            });
        }
        catch (error) {
            return res.status(422).json({
              success: false,
              error: error.details
            });
        }
        let check;
        switch (service) {
            case 'openai':
                check = await callOpenAIModelsApi(apikey)
                break;
            case 'anthropic':
                check = await callAnthropicApi(apikey)
                break;
            case 'groq':
                check = await callGroqApi(apikey)
                break;
            case 'open_router':
                check = await callOpenRouterApi(apikey)
                break;
            case 'mistral':
                check = await callMistralApi(apikey)
                break;
            case 'gemini':
                check = await callGeminiApi(apikey)
                break;
            case 'ai_ml':
                check = await callAiMlApi(apikey)
                break;
        }
        if(!check.success){
            return res.status(400).json({ success: false, error: "invalid apikey or apikey is expired" });
        }
        apikey = await Helper.encrypt(apikey)
        const result = await apikeySaveService.saveApi({org_id, apikey, service, name, comment, folder_id, user_id});
        
        const decryptedApiKey = await Helper.decrypt(apikey)
        const maskedApiKey = await Helper.maskApiKey(decryptedApiKey)
        result.api.apikey = maskedApiKey

        if(result.success){
            return res.status(200).json(result);
        }
        else {
            return res.status(400).json({ success: false, error: result.error });
        }
    }
    catch(error){
        console.error("Error saving API key: ", error);
        return res.status(400).json({success: false, error: error.message});
    }
}

const getAllApikeys = async(req, res) => {
    try {
        const org_id = req.profile?.org?.id;
        const folder_id = req.profile?.extraDetails?.folder_id;
        const user_id = req.profile.user.id;
        const isEmbedUser = req.IsEmbedUser
        const result = await apikeySaveService.getAllApiKeyService(org_id, folder_id, user_id, isEmbedUser);
        if (result.success) {
            for (let apiKeyObj of result.result) {
                const decryptedApiKey = await Helper.decrypt(apiKeyObj.apikey);
                const maskedApiKey = await Helper.maskApiKey(decryptedApiKey);
                apiKeyObj.apikey = maskedApiKey;
            }
            return res.status(200).json(result);
        } 
        else {
            return res.status(400).json({ success: false, error: result.error });
        }

    }
    catch (error) {
        console.error("Error getting all API keys: ", error);
        return res.status(400).json({success: false, error: error.message});
        
    }
}

async function updateApikey(req, res) {
    try {
        let apikey = req.body.apikey;
        const { name, comment, service, folder_id, user_id } = req.body;
        const { apikey_object_id } = req.params;
        try{
            await updateApikeySchema.validateAsync({
                apikey,
                name,
                comment,
                service,
                apikey_object_id,
                folder_id,
                user_id
            });
        }
        catch (error) {
            return res.status(422).json({
              success: false,
              error: error.details
            });
        }
        if(apikey){
            apikey = Helper.encrypt(apikey); 
        }
        const result = await apikeySaveService.updateApikey(apikey_object_id, apikey, name, service, comment);
        let decryptedApiKey, maskedApiKey;
        if(apikey){
            decryptedApiKey = await Helper.decrypt(apikey)
            maskedApiKey = await Helper.maskApiKey(decryptedApiKey)
            result.apikey = maskedApiKey
        }
        if(result?.updatedData?.version_ids?.length > 0) {
            result.updatedData.version_ids = result.updatedData.version_ids.map(id => 'AIMIDDLEWARE_' + id.toString());
        }
        if (result.success) {
            await deleteInCache(result?.updatedData?.version_ids)
            return res.status(200).json({
                success: true,
                message: "Apikey updated successfully",
                apikey : result?.apikey
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'No records updated or bridge not found'
            });
        }
    } catch (e) {
        return res.status(400).json({
            success: false,
            error: e.message
        });
    }
}

async function deleteApikey(req, res) {
    try {
        const body = req.body;
        const apikey_object_id = body.apikey_object_id;
        try{
            await deleteApikeySchema.validateAsync({
                apikey_object_id
            });
        }
        catch (error) {
            return res.status(422).json({
                success: false,
                error: error.details
            });
        }
        const apikeys_data = await  apikeySaveService.getApiKeyData(apikey_object_id)
        let version_ids = apikeys_data?.version_ids || []
        const service = apikeys_data?.service
        await apikeySaveService.getVersionsUsingId(version_ids, service)
        if(version_ids?.length > 0) {
            version_ids = version_ids.map(id => 'AIMIDDLEWARE_' + id.toString());
        }
        const result = await apikeySaveService.deleteApi(apikey_object_id);
        if (result.success) {
        await deleteInCache(result?.updatedData?.version_ids)
        return res.status(200).json({
        success: true,
        message: 'Apikey deleted successfully'
        });
        } else {
        return res.status(400).json({
        success: false,
        message: result.error
        });
        }
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

export default{
  saveApikey,
  getAllApikeys,
  deleteApikey,
  updateApikey
}