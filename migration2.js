import { MongoClient, ObjectId } from 'mongodb';

async function migrateData() {
    const client = new MongoClient('mongodb+srv://Arpitsagarjain:Walkover123@cluster0.eo2iuez.mongodb.net/AI_Middleware?retryWrites=true&w=majority');

    try {
        await client.connect();

        const db = client.db("AI_Middleware");
        const configurations = db.collection("configuration_versions");
        const apicalls = db.collection("apicalls");

        const configDocs = await configurations.find().toArray();

        for (const config of configDocs) {
            const configId = config._id; // Get the ObjectId of the configuration document
            const functionIds = config.function_ids || [];

            for (const functionId of functionIds) {
                const apicallId = new ObjectId(functionId);
                await apicalls.updateOne(
                    { _id: apicallId },
                    { $addToSet: { version_ids: configId } } // Add configId to version_ids array
                );
            }
        }

        console.log("Migration completed successfully!");
    } catch (error) {
        console.error("Error during migration:", error);
    } finally {
        await client.close();
    }
};

migrateData().catch(console.error);