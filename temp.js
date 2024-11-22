import { MongoClient } from 'mongodb';

async function duplicateCollection() {
    const client = new MongoClient('mongodb+srv://prod-user:ezZccEUxWzK619fL@socket-analyser.01gom.mongodb.net/AI_Middleware-test?retryWrites=true&w=majority');
    try {
        await client.connect();
        const db = client.db('AI_Middleware-test');
        const sourceCollection = db.collection('configurations'); 
        const targetCollection = db.collection('configuration_versions');

        const cursor = sourceCollection.find();
        const excludedKeys = ['name', 'slugName', 'bridgeType'];

        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            const filteredDoc = { ...doc };
            excludedKeys.forEach(key => delete filteredDoc[key]);
            filteredDoc.parent_id = doc._id;

            // Insert the filtered document into the target collection
            const result = await targetCollection.insertOne(filteredDoc);
            const insertedId = result.insertedId;

            // Update the source document with the new version ID
            await sourceCollection.updateOne(
                { _id: doc._id },
                {
                    $set: { published_version_id: insertedId, versions: [insertedId] }
                }
            );
        }
    } catch (error) {
        console.error('Error duplicating collection:', error);
    } finally {
        await client.close();
    }
}

duplicateCollection().catch(console.error);