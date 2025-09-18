import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority');

// Helper function to convert value to string
function convertToString(value) {
    if (value instanceof ObjectId) {
        return value.toString();
    }
    return typeof value === 'string' ? value : String(value);
}

try {
    await client.connect();
    const db = client.db("AI_Middleware");
    const apiKeyCredentials = db.collection("apikeycredentials");
    const configuration_versions = db.collection("configuration_versions");
    
    // First, migrate existing apikeycredentials documents to merge version_id and version_ids
    console.log("Starting migration of existing apikeycredentials documents...");
    const apiKeysCursor = apiKeyCredentials.find({});
    
    while (await apiKeysCursor.hasNext()) {
        const apiKeyDoc = await apiKeysCursor.next();
        
        // Get existing arrays
        const versionId = apiKeyDoc.version_id || [];
        const versionIds = apiKeyDoc.version_ids || [];
        
        // Merge and convert all values to strings
        const mergedVersions = [...versionId, ...versionIds];
        const stringVersions = mergedVersions.map(convertToString);
        
        // Remove duplicates using Set
        const uniqueVersions = [...new Set(stringVersions)];
        
        // Update document with merged version_ids and remove version_id
        await apiKeyCredentials.updateOne(
            { _id: apiKeyDoc._id },
            {
                $set: { version_ids: uniqueVersions },
                $unset: { version_id: "" }
            }
        );
        
        console.log(`Merged version arrays for apikeycredentials._id=${apiKeyDoc._id}: ${uniqueVersions.length} unique versions`);
    }
    
    console.log("Starting configuration versions processing...");
    const cursor = configuration_versions.find({});
    while (await cursor.hasNext()) {
        const configVersion = await cursor.next();
        const config_version_id = configVersion._id.toString();
        const apikeys = configVersion.apikey_object_id || {};
        
        for (const [name, idstr] of Object.entries(apikeys)) {
            if (!idstr) continue;
            
            let queryId = null;
            if (idstr instanceof ObjectId) {
                queryId = idstr; // already ObjectId
            } else if (ObjectId.isValid(idstr)) {
                queryId = new ObjectId(idstr); // convert string to ObjectId
            }
            
            let api_key_Doc = queryId
                ? await apiKeyCredentials.findOne({ _id: queryId })
                : null;
            
            if (!api_key_Doc) continue;
            
            // Ensure version_ids exists (should exist after migration above)
            if (!Array.isArray(api_key_Doc.version_ids)) {
                await apiKeyCredentials.updateOne(
                    { _id: api_key_Doc._id },
                    { $set: { version_ids: [] } }
                );
                api_key_Doc.version_ids = [];
            }
            
            // Check if config_version_id already exists in version_ids
            const exists = api_key_Doc.version_ids.some(
                (v) => convertToString(v) === config_version_id
            );
            
            if (!exists) {
                await apiKeyCredentials.updateOne(
                    { _id: api_key_Doc._id },
                    { $push: { version_ids: config_version_id } }
                );
                console.log(
                    `Added ${config_version_id} to version_ids of apikeycredentials._id=${api_key_Doc._id} (via ${name})`
                );
            }
        }
    }
} catch (error) {
    console.error("API key version ID migration failed:", error);
} finally {
    await client.close();
}