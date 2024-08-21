import apikeySaveService from "../../db_services/apikeySaveService.js";
import { services } from "../../configs/models.js";
import Helper from "../utils/helper.js";

const saveApikey = async(req,res) => {
    try {
        const {service, org_id, name, comment} = req.body;
        let apikey = req.body.apikey
        if (!org_id || !apikey || !service || !name) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: org_id, apikey, service, and name are all required."
              });
        }
        if (!(service in services)) {
            return res.status(400).json({
              success: false,
              error: "service does not exist!"
            });
          }
        apikey = await Helper.encrypt(apikey)
        const apiName = await apikeySaveService.getName(name, org_id);
        if(apiName.success == true && apiName.result != null){
            return res.status(400).json({
                success: false,
                error: "apikey Name already exists!!!"
              });
        }
        const result = await apikeySaveService.saveApi({org_id, apikey, service, name, comment});
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
        const org_id = req.body.org_id;
        const result = await apikeySaveService.getAllApi(org_id);
        if (result.success) {
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

export default{
  saveApikey,
  getAllApikeys
}