import apikeySaveService from "../../db_services/apikeySaveService.js";
import Helper from "../utils/helper.js";
import { saveApikeySchema, updateApikeySchema, deleteApikeySchema } from "../../validation/joi_validation/apikey.js";

const saveApikey = async(req,res) => {
    try {
        const {service, name, comment} = req.body;
        const org_id = req.profile?.org?.id;
        let apikey = req.body.apikey
        try{
            await saveApikeySchema.validateAsync({
                apikey,
                service,
                name,
                comment
            });
        }
        catch (error) {
            return res.status(422).json({
              success: false,
              error: error.details
            });
        }
        apikey = await Helper.encrypt(apikey)
        const result = await apikeySaveService.saveApi({org_id, apikey, service, name, comment});
        
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
        const result = await apikeySaveService.getAllApi(org_id);
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
        const { name, comment, service } = req.body;
        const { apikey_object_id } = req.params;
        try{
            await updateApikeySchema.validateAsync({
                apikey,
                name,
                comment,
                service,
                apikey_object_id
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
        const decryptedApiKey = await Helper.decrypt(apikey)
        const maskedApiKey = await Helper.maskApiKey(decryptedApiKey)
        result.apikey = maskedApiKey

        if (result.success) {
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
        const result = await apikeySaveService.deleteApi(apikey_object_id);
            if (result.success) {
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