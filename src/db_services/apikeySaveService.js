import ApikeyCredential from "../mongoModel/apiModel.js";
import versionModel from "../mongoModel/bridge_version.js"
import configurationModel from "../mongoModel/configuration.js";

const saveApi = async (data) => {
    try {
        const { org_id, apikey, service, name, comment, folder_id, user_id } = data;
        const version_ids = []
        const result = await new ApikeyCredential({
            org_id,
            apikey,
            service,
            name,
            comment,
            folder_id,
            user_id,
            version_ids
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
const getAllApiKeyService = async(org_id, folder_id, user_id, isEmbedUser)=>{
    try {
        const query = { org_id: org_id}
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
        // First, fetch all version documents to get their parent_ids
        const versionDocs = await versionModel.find({ _id: { $in: versionIds } }).lean();
        
        // Extract parent_ids from version documents
        const parentIds = versionDocs
            .filter(doc => doc.parent_id)
            .map(doc => doc.parent_id);
        
        // Create bulk operations for version documents
        const versionBulkOps = versionIds.map(versionId => ({
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

        // Execute bulk operations for versions
        const versionResult = await versionModel.bulkWrite(versionBulkOps);
        
        // Handle parent documents if any parent_ids exist
        let configResult = { modifiedCount: 0 };
        if (parentIds.length > 0) {
            // Process each document individually instead of using updateMany
            let modifiedCount = 0;
            
            for (const parentId of parentIds) {
                try {
                    const updateResult = await configurationModel.updateOne(
                        { _id: parentId },
                        { $unset: { [`apikey_object_id.${service}`]: "" } }
                    );
                    
                    if (updateResult.modifiedCount > 0) {
                        modifiedCount++;
                    }
                    
                    // Log the result for debugging
                    console.log(`Update result for ${parentId}:`, JSON.stringify(updateResult));
                } catch (updateError) {
                    console.error(`Error updating document ${parentId}:`, updateError);
                }
            }
            
            configResult.modifiedCount = modifiedCount;
        }
        
        return {
            success: true,
            modifiedCount: versionResult.modifiedCount + configResult.modifiedCount,
            versionModifiedCount: versionResult.modifiedCount,
            parentModifiedCount: configResult.modifiedCount
        };

    } catch (error) {
        console.error('Error updating versions and parents:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export default {
    saveApi,
    getName,
    getAllApiKeyService,
    updateApikey,
    deleteApi,
    getApiKeyData,
    getVersionsUsingId
}