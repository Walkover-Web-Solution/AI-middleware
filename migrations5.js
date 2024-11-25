import { MongoClient, ObjectId } from 'mongodb';

async function migrate() {
    const client = new MongoClient('mongodb+srv://Arpitsagarjain:Walkover123@cluster0.eo2iuez.mongodb.net/AI_Middleware?retryWrites=true&w=majority');

    try {
        await client.connect();
        const db = client.db('AI_Middleware');
        const collection = db.collection('configuration_versions');

        const cursor = collection.find({});

        while (await cursor.hasNext()) {
            const doc = await cursor.next();

            // Convert ObjectId in array to strings
            if (doc.parent_id && ObjectId.isValid(doc.parent_id)) {
                doc.parent_id = doc.parent_id.toString();
            }

            if (doc.published_version_id && ObjectId.isValid(doc.published_version_id)) {
                doc.published_version_id = doc.published_version_id.toString();
            }

            if (Array.isArray(doc.versions)) {
                doc.versions = doc.versions.map(item => {
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