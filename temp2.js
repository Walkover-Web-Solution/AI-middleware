// migration_populate_version_ids.js

import { MongoClient, ObjectId } from 'mongodb';

async function migratePopulateVersionIds() {
    // **1. Connection Setup**
    const uri = '';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        // **2. Connect to MongoDB**
        await client.connect();
        console.log("Connected to MongoDB.");

        const db = client.db("AI_Middleware");
        const configurations = db.collection("configuration_versions");
        const apikeycredentials = db.collection("apikeycredentials");

        // **3. Fetch All Configuration Documents**
        const configCursor = configurations.find({});
        let processedCount = 0;
        let updatedCount = 0;

        while (await configCursor.hasNext()) {
            const config = await configCursor.next();
            const configId = config._id;
            const apikeyObject = config.apikey_object_id;

            // **4. Validate `apikey_object_id` Structure**
            if (typeof apikeyObject === 'object' && apikeyObject !== null) {
                for (const [service, apikeyIdStr] of Object.entries(apikeyObject)) {
                    if (typeof apikeyIdStr !== 'string') {
                        console.warn(`Skipping invalid apikey ID for service "${service}" in config _id: ${configId}`);
                        continue;
                    }

                    let apikeyObjectId;
                    try {
                        apikeyObjectId = new ObjectId(apikeyIdStr);
                    } catch (e) {
                        console.error(`Invalid ObjectId string: ${apikeyIdStr} for service "${service}" in config _id: ${configId} ${e}`);
                        continue; // Skip to the next service
                    }

                    // **5. Update `apikeycredentials` Document**
                    const updateResult = await apikeycredentials.updateOne(
                        { _id: apikeyObjectId },
                        { $addToSet: { version_ids: configId } }
                    );

                    if (updateResult.matchedCount === 0) {
                        console.warn(`No apikeycredentials document found with _id: ${apikeyObjectId} for config _id: ${configId}`);
                    } else if (updateResult.modifiedCount > 0) {
                        updatedCount += 1;
                        console.log(`Updated apikeycredentials _id: ${apikeyObjectId} with config _id: ${configId}`);
                    } else {
                        // The version_ids array already contains the configId
                        console.log(`apikeycredentials _id: ${apikeyObjectId} already contains config _id: ${configId}`);
                    }
                }
            } else {
                console.warn(`Skipping config _id: ${configId} due to invalid apikey_object_id structure.`);
            }

            processedCount += 1;

            // **6. Optional: Progress Logging**
            if (processedCount % 1000 === 0) {
                console.log(`Processed ${processedCount} configuration documents so far...`);
            }
        }

        console.log(`Migration completed. Processed ${processedCount} configurations.`);
        console.log(`Updated ${updatedCount} apikeycredentials documents.`);

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        // **7. Close the Connection**
        await client.close();
        console.log("MongoDB connection closed.");
    }
}

// **8. Execute the Migration**
migratePopulateVersionIds().catch(console.error);
