import ApikeyCredential from "../mongoModel/apiModel.js";
import versionModel from "../mongoModel/bridge_version.js"

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

async function getApiKeyData(apikey_object_id)
{
    try {
        const result = await ApikeyCredential.findOne({ _id: apikey_object_id });
        return {
            success: true,
            result: result
        };
    } catch (error) {
        console.error("Error getting API data: ", error);
        return {
            success: false,
            error: error
        };
    }
}

async function getVersionsUsingId(versionIds, apikey_object_id){

if (versionIds.length > 0) {
    // **2. Fetch all related configuration_versions documents**
    const configurations = await versionModel.find({ _id: { $in: versionIds } }).toArray();

    // **3. Iterate over each configuration and update the apikey_object_id**
    const bulkOperations = configurations.map(config => {
        const configId = config._id;
        const apikeyObject = config.apikey_object_id;

        // Find the service(s) that reference the API key being deleted
        const servicesToUpdate = [];
        for (const [service, keyId] of Object.entries(apikeyObject)) {
            if (keyId === apikey_object_id) {
                servicesToUpdate.push(service);
            }
        }

        if (servicesToUpdate.length === 0) {
            // No services to update in this configuration
            return null;
        }

        // Prepare the update object
        const updateObj = {};
        servicesToUpdate.forEach(service => {
            updateObj[`apikey_object_id.${service}`] = "";
        });

        return {
            updateOne: {
                filter: { _id: configId },
                update: { $set: updateObj }
            }
        };
    }).filter(operation => operation !== null); // Remove null operations

    if (bulkOperations.length > 0) {
        // **4. Perform bulk updates**
        const bulkWriteResult = await versionModel.bulkWrite(bulkOperations);
        console.log(`Bulk update result: ${JSON.stringify(bulkWriteResult)}`);
    }
    return {
        success: true,
        message: 'versions updated successfully'
    }
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