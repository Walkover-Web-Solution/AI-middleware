import { MongoClient, ObjectId } from 'mongodb';

// Connection URI
const MONGODB_URI = 'mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware-test';
const DB_NAME = "AI_Middleware-test";

async function migrateDocIds() {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db(DB_NAME);
        const configurations = db.collection("configurations");
        const versions = db.collection("configuration_versions");

        // Helper function to process a collection
        async function processCollection(collection, collectionName) {
            console.log(`\nProcessing collection: ${collectionName}`);
            let processedCount = 0;
            let modifiedCount = 0;

            const cursor = collection.find({ "doc_ids": { $exists: true, $not: { $size: 0 } } });

            while (await cursor.hasNext()) {
                const doc = await cursor.next();
                processedCount++;

                if (!Array.isArray(doc.doc_ids)) continue;

                const originalDocIds = doc.doc_ids;
                // Filter out non-object entries (assuming valid entries are objects with resource_id, etc.)
                // We keep it if it is an object and NOT null
                const validDocIds = originalDocIds.filter(item =>
                    typeof item === 'object' && item !== null && !Array.isArray(item)
                );

                // If changes are needed
                if (validDocIds.length !== originalDocIds.length) {
                    await collection.updateOne(
                        { _id: doc._id },
                        {
                            $set: { doc_ids: validDocIds }
                        }
                    );
                    modifiedCount++;
                    console.log(`  Updated document ${doc._id}: Removed ${originalDocIds.length - validDocIds.length} invalid entries.`);
                }
            }
            console.log(`Finished ${collectionName}: Processed ${processedCount}, Modified ${modifiedCount}`);
        }

        // Run migration on both collections
        await processCollection(configurations, "configurations");
        await processCollection(versions, "configuration_versions");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await client.close();
        console.log('\nMongoDB connection closed');
    }
}

migrateDocIds();
