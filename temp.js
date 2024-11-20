import { MongoClient } from 'mongodb';

async function duplicateCollection() {
    const client = new MongoClient('mongodb+srv://Arpitsagarjain:Walkover123@cluster0.eo2iuez.mongodb.net/AI_Middleware?retryWrites=true&w=majority');
    try {
        await client.connect();
        const db = client.db('AI_Middleware');
        const sourceCollection = db.collection('configurations'); 
        const targetCollection = db.collection('configuration_versions');

        const cursor = sourceCollection.find();
        const excludedKeys = ['name', 'slugName', 'bridgeType'];

        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            const filteredDoc = { ...doc };
            excludedKeys.forEach(key => delete filteredDoc[key]);
            await targetCollection.insertOne(filteredDoc);
        }
    } catch (error) {
        console.error('Error duplicating collection:', error);
    } finally {
        await client.close();
    }
}

duplicateCollection().catch(console.error);