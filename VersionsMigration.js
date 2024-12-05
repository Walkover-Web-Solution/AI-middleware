import { MongoClient} from 'mongodb';

async function migrateData() {
    const client = new MongoClient('mongodb+srv://Arpitsagarjain:Walkover123@cluster0.eo2iuez.mongodb.net/AI_Middleware?retryWrites=true&w=majority');
    
    try {
        await client.connect();

        const db = client.db("AI_Middleware");
        const configurations = db.collection("configurations");
        const configurationVersions = db.collection("configuration_versions");

        const configDocs = await configurations.find().toArray();

        for (const config of configDocs) {
            const configId = config._id;
            const versions = [];

            const matchingVersions = await configurationVersions.find({ parent_id: configId.toString()}).toArray();

            for (const versionDoc of matchingVersions) {
                versions.push(versionDoc._id.toString());
            }

            await configurations.updateOne(
                { _id: configId },
                { $set: { versions: versions } }
            );
        }

        await configurationVersions.updateMany(
            {},
            { $unset: { versions: "" } }
        );

        console.log("Migration completed successfully!");

    } catch (error) {
        console.error("Error during migration:", error);
    } finally {
        await client.close();
    }
};

migrateData().catch(console.error);
