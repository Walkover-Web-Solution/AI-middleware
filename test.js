import { MongoClient, ObjectId } from 'mongodb';
const mongoUrl = process.env.MONGODB_CONNECTION_URI;
const client = new MongoClient(mongoUrl);

async function migrateCollection(collection, collectionName) {
    console.log(`Starting migration for ${collectionName} collection...`);
    
    const cursor = collection.find({ service: 'openai_response' });
    let updatedCount = 0;
    
    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        
        // Update service from 'openai_response' to 'openai'
        await collection.updateOne(
            { _id: doc._id },
            { $set: { service: 'openai' } }
        );
        
        updatedCount++;
        console.log(`Updated document _id=${doc._id} in ${collectionName}: service 'openai_response' -> 'openai'`);
    }
    
    console.log(`${collectionName} migration completed. Updated ${updatedCount} documents.`);
    return updatedCount;
}

try {
    await client.connect();
    const db = client.db("AI_Middleware-test");
    
    // Get both collections
    const configurations = db.collection("configurations");
    const configurationVersions = db.collection("configuration_versions");
    
    // Migrate both collections
    const configurationsUpdated = await migrateCollection(configurations, "configurations");
    const configurationVersionsUpdated = await migrateCollection(configurationVersions, "configuration_versions");
    
    console.log(`\nMigration completed successfully!`);
    console.log(`Total documents updated: ${configurationsUpdated + configurationVersionsUpdated}`);
    console.log(`- configurations: ${configurationsUpdated}`);
    console.log(`- configuration_versions: ${configurationVersionsUpdated}`);
    
} catch (error) {
    console.error("Service migration failed:", error);
} finally {
    await client.close();
}