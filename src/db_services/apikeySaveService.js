import apiSaveModel from "../mongoModel/apiModel.js";

const saveApi = async (data) => {
    try {
        const { org_id, apikey, service, name, comment } = data;
        const result = await new apiSaveModel({
            org_id,
            apikey,
            service,
            name,
            comment
        }).save();

        return {
            success: true,
            api: result
        };
    } catch (error) {
        console.error("Error saving API: ", error);
        return {
            success: false,
            error: error.message
        };
    }
};

const getName = async (name, org_id)=>{
    try {
        const result = await apiSaveModel.findOne({
        org_id: org_id,
        name: name
        })

        return {
            success: true,
            result : result
        }
    }
    catch (error) {
        console.error("Error getting API: ", error);
        return {
            success: false,
            error: error.message
        };
    }

}
const getAllApi = async(org_id)=>{
    try {
        const result  = await apiSaveModel.find({
            org_id: org_id
        })
        return {
            success: true,
            result : result
        }
    } 
    catch(error) {
        console.error("Error getting all API: ", error);
        return {
            success: false,
            error: error.message
        };
    }
}

export default {
    saveApi,
    getName,
    getAllApi
}