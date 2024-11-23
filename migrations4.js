import { MongoClient, ObjectId } from 'mongodb';

async function migrate() {
    const client = new MongoClient('mongodb+srv://prod-user:ezZccEUxWzK619fL@socket-analyser.01gom.mongodb.net/AI_Middleware-test?retryWrites=true&w=majority');

    try {
        await client.connect();
        const db = client.db('AI_Middleware-test');
        const collection = db.collection('apicalls');

        const cursor = collection.find({});

        while (await cursor.hasNext()) {
            const doc = await cursor.next();

            // Convert ObjectId in array to strings
            if (Array.isArray(doc.version_ids)) {
                doc.version_ids = doc.version_ids.map(item => {
                    if (ObjectId.isValid(item)) {
                        return item.toString();
                    }
                    return item;
                });
            }

            // Update the document in the database
            await collection.updateOne({ _id: doc._id }, { $set: doc });
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await client.close();
    }
}

migrate().catch(console.error);