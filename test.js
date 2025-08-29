import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority');
try {
    await client.connect();
    const db = client.db("AI_Middleware");
    const apiKeyCredentials = db.collection("apikeycredentials");
    const configuration_versions = db.collection("configuration_versions");
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
            // Ensure version_id exists
            if (!Array.isArray(api_key_Doc.version_id)) {
                await apiKeyCredentials.updateOne(
                    { _id: api_key_Doc._id },
                    { $set: { version_id: [] } }
                );
                api_key_Doc.version_id = [];
            }
            const exists = api_key_Doc.version_id.some(
                (v) => v?.toString() === config_version_id
            );
            if (!exists) {
                await apiKeyCredentials.updateOne(
                    { _id: api_key_Doc._id },
                    { $push: { version_id: config_version_id } }
                );
                console.log(
                    `Added ${config_version_id} to version_id of apikeycredentials._id=${api_key_Doc._id} (via ${name})`
                );
            }
        }
    }
} catch (error) {
    console.error("API key version ID migration failed:", error);
} finally {
    await client.close();
}