import { MongoClient, ObjectId } from 'mongodb';

async function runMigration(req, res){
    const MONGO_URI = process.env.MONGODB_CONNECTION_URI
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db("AI_Middleware");
        const apiKeyCredentials = db.collection("apikeycredentials");
        const collections = [{collection: db.collection("configuration_versions")}, {collection: db.collection("configurations")}]

        for (const collection of collections) {
            const cursor = collection.collection.find({});
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
                // Ensure version_id exists and normalize to strings
                if (!Array.isArray(api_key_Doc.version_ids)) {
                    await apiKeyCredentials.updateOne(
                        { _id: api_key_Doc._id },
                        { $set: { version_ids: [] } }
                    );
                    api_key_Doc.version_ids = [];
                } else {
                    // Convert any ObjectId values to strings
                    const normalizedVersionIds = api_key_Doc.version_ids.map(id => 
                        id instanceof ObjectId ? id.toString() : id
                    );
                    
                    // Update the array if any conversion was needed
                    const hasObjectIds = api_key_Doc.version_ids.some(id => id instanceof ObjectId);
                    if (hasObjectIds) {
                        await apiKeyCredentials.updateOne(
                            { _id: api_key_Doc._id },
                            { $set: { version_ids: normalizedVersionIds } }
                        );
                        api_key_Doc.version_ids = normalizedVersionIds;
                        console.log(`Normalized version_ids to strings for apikeycredentials._id=${api_key_Doc._id}`);
                    }
                }
                const exists = api_key_Doc.version_ids.some(
                    (v) => v?.toString() === config_version_id
                );
                if (!exists) {
                    await apiKeyCredentials.updateOne(
                        { _id: api_key_Doc._id },
                        { $push: { version_ids: config_version_id } }
                    );
                    console.log(
                        `Added ${config_version_id} to version_id of apikeycredentials._id=${api_key_Doc._id} (via ${name})` 
                    );
                }
                }
            }
        }
    } catch (error) {
        console.error("API key version ID migration failed:", error);
    } finally {
        await client.close();
    }
}

runMigration().catch(console.error);
