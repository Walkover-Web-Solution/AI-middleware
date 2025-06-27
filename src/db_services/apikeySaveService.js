import ApikeyCredential from "../mongoModel/apiModel.js";
import versionModel from "../mongoModel/bridge_version.js"

const saveApi = async (data) => {
    try {
        const { org_id, apikey, service, name, comment, folder_id, user_id } = data;
        const result = await new ApikeyCredential({
            org_id,
            apikey,
            service,
            name,
            comment,
            folder_id,
            user_id
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
const getAllApi = async(org_id, folder_id, user_id, isEmbedUser)=>{
    try {
        const query = { org_id: org_id }
        if(folder_id) query.folder_id = folder_id
        if(user_id && isEmbedUser) query.user_id = user_id
        const result  = await ApikeyCredential.find(query)
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
            apikeyCredentialResult = await ApikeyCredential.findOneAndUpdate(
                { _id: apikey_object_id },
                { $set: updateFields },
                { new: true }
            ).lean();
        }

        if (!apikeyCredentialResult) {
            return {
                success: false,
                error: 'No records updated or bridge not found'
            };
        }

        return {
            success: true,
            apikey: apikey || updateFields.apikey,
            updatedData: apikeyCredentialResult
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

async function getApiKeyData(apikey_object_id)
{
    try {
        const result = await ApikeyCredential.findOne({ _id: apikey_object_id });
        const resultObject = result.toObject();
        return resultObject
    } catch (error) {
        console.error("Error getting API data: ", error);
        return {
            success: false,
            error: error
        };
    }
}

async function getVersionsUsingId(versionIds, service) {
    if (!versionIds?.length) {
        return {
            success: false,
            message: 'No version IDs provided'
        };
    }

    try {
        const bulkOps = versionIds.map(versionId => ({
            updateOne: {
                filter: { 
                    _id: versionId,
                    $or: [
                        { [`apikey_object_id.${service}`]: { $exists: true } },
                        { service: service }
                    ]
                },
                update: {
                    $set: { [`apikey_object_id.${service}`]: '' }
                }
            }
        }));

        const result = await versionModel.bulkWrite(bulkOps);
        
        return {
            success: true,
            modifiedCount: result.modifiedCount
        };

    } catch (error) {
        console.error('Error updating versions:', error);
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
    deleteApi,
    getApiKeyData,
    getVersionsUsingId
}