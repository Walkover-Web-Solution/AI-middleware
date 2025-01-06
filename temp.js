import { MongoClient } from 'mongodb';

async function migrateData() {
    const client = new MongoClient('');
    
    try {
        await client.connect();

        const db = client.db("AI_Middleware-test");
        const configurations = db.collection("configuration_versions");
        const apikeycredentials = db.collection("apikeycredentials");

        // Update configurations collection
        const configCursor = configurations.find({});
        while (await configCursor.hasNext()) {
            const config = await configCursor.next();
            const service = config.service;
            const apikeyObjectId = config.apikey_object_id;

            if (typeof apikeyObjectId === 'string') {
                const newApikeyObjectId = { [service]: apikeyObjectId };
                await configurations.updateOne(
                    { _id: config._id },
                    { $set: { apikey_object_id: newApikeyObjectId } }
                );

                // Update apikeycredentials collection
                await apikeycredentials.updateOne(
                    { _id: apikeyObjectId },
                    { $addToSet: { version_ids: config._id } }
                );
            }
        }

        // // Update apikeycredentials collection for entries without matching config
        // const apiKeyCursor = apikeycredentials.find({});
        // while (await apiKeyCursor.hasNext()) {
        //     const apiKey = await apiKeyCursor.next();
        //     if (!apiKey.version_ids || !apiKey.version_ids.length) {
        //         await apikeycredentials.updateOne(
        //             { _id: apiKey._id },
        //             { $set: { version_ids: [] } }
        //         );
        //     }
        // }

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await client.close();
    }
}

migrateData().catch(console.error);