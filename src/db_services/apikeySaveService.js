import ApikeyCredential from "../mongoModel/apiModel.js";
import versionModel from "../mongoModel/bridge_version.js"
import configurationModel from "../mongoModel/configuration.js";

const saveApi = async (data) => {
    try {
        const { org_id, apikey, service, name, comment, folder_id, user_id, apikey_quota } = data;
        const version_ids = []
        const result = await new ApikeyCredential({
            org_id,
            apikey,
            service,
            name,
            comment,
            folder_id,
            user_id,
            version_ids,
            apikey_quota
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
const getAllApiKeyService = async (org_id, folder_id, user_id, isEmbedUser) => {
    try {
        const query = { org_id: org_id }

        if (folder_id) {
            query.folder_id = folder_id
        } else {
            query.$or = [
                { folder_id: "" },
                { folder_id: null },
                { folder_id: { $exists: false } }
            ]
        }
        if (user_id && isEmbedUser) query.user_id = String(user_id)

        const result = await ApikeyCredential.find(query)
        return {
            success: true,
            result: result
        }
    }
    catch (error) {
        console.error("Error getting all API: ", error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function updateApikey(apikey_object_id, apikey = null, name = null, service = null, comment = null, apikey_quota = null) {
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
        if (apikey_quota) {
            updateFields.apikey_quota = apikey_quota;
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
        // First, fetch all version documents to get their parent_ids (only fetch parent_id field)
        const versionDocs = await versionModel.find(
            { _id: { $in: versionIds } }, 
            { parent_id: 1 }
        ).lean();
        
        // Extract unique parent_ids from version documents
        const parentIds = [...new Set(
            versionDocs
                .filter(doc => doc.parent_id)
                .map(doc => doc.parent_id)
        )];

        // Process version documents using bulkWrite
        const versionResult = await processBulkUpdates(
            versionModel, 
            versionIds, 
            service
        );
        
        // Process parent documents using bulkWrite if any exist
        const configResult = parentIds.length > 0 
            ? await processBulkUpdates(configurationModel, parentIds, service)
            : { modifiedCount: 0 };
        
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

/**
 * Helper function to process bulk updates for a collection
 * @param {Object} model - Mongoose model to update
 * @param {Array} ids - Array of document IDs to update
 * @param {String} service - Service name to unset in apikey_object_id
 * @returns {Object} Result with modifiedCount
 */
async function processBulkUpdates(model, ids, service) {
    if (!ids.length) return { modifiedCount: 0 };
    
    try {
        // Create bulk operations
        const bulkOps = ids.map(id => ({
            updateOne: {
                filter: { _id: id },
                update: { $unset: { [`apikey_object_id.${service}`]: "" } }
            }
        }));
        
        // Execute bulk operations
        const bulkResult = await model.bulkWrite(bulkOps);
        
        // Log results for debugging
        console.log(`Bulk update results for ${model.modelName}:`, 
            JSON.stringify({
                matchedCount: bulkResult.matchedCount,
                modifiedCount: bulkResult.modifiedCount
            })
        );
        
        return { modifiedCount: bulkResult.modifiedCount };
    } catch (error) {
        console.error(`Error in bulk update for ${model.modelName}:`, error);
        return { modifiedCount: 0 };
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