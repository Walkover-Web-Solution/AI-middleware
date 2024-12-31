import ApikeyCredential from "../mongoModel/apiModel.js";

const saveApi = async (data) => {
    try {
        const { org_id, apikey, service, name, comment } = data;
        const result = await new ApikeyCredential({
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
        const result = await ApikeyCredential.findOne({
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
        const result  = await ApikeyCredential.find({
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

async function updateApikey(apikey_object_id, apikey = null, name = null, service = null, comment = null) {
    try {
        const updateFields = {};

        if (apikey) {
            updateFields.apikey = apikey;
        }
        if (name) {
            updateFields.name = name;
        }
        if (service) {
            updateFields.service = service;
        }
        if (comment) {
            updateFields.comment = comment;
        }

        let apikeyCredentialResult;

        if (Object.keys(updateFields).length > 0) {
            apikeyCredentialResult = await ApikeyCredential.updateOne(
                { _id: apikey_object_id },
                { $set: updateFields }
            );
        }

        const totalMatchedCount = (apikeyCredentialResult?.matchedCount || 0);

        if (totalMatchedCount === 0) {
            return {
                success: false,
                error: 'No records updated or bridge not found'
            };
        }

        return {
            success: true,
            apikey: apikey || updateFields.apikey
        };
    } catch (error) {
        console.error(error);
        return {
            success: false,
            error: 'Something went wrong!'
        };
    }
}


async function deleteApi(apikey_object_id) {
    try {
        const result = await ApikeyCredential.deleteOne({ _id: apikey_object_id});
        if (result.deletedCount > 0) {
            return { success: true };
        } 
        else {
            return {
                success: false,
                error: 'API key not found'
            };
        }
    } catch (error) {
        console.error(`Error: ${error}`);
        return {
            success: false,
            error: error.message
        };
    }
}


export default {
    saveApi,
    getName,
    getAllApi,
    updateApikey,
    deleteApi
}