import { MongoClient } from 'mongodb';

async function migrateStarterQuestion() {
    const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware-test');

    try {
        await client.connect();
        const db = client.db("AI_Middleware-test");
        const configurations = db.collection("configurations");

        const cursor = configurations.find({});

        while (await cursor.hasNext()) {
            const config = await cursor.next();

            const starter = config.starterQuestion;

            // Only modify if starterQuestion is an object with a 'questions' array
            if (starter && typeof starter === 'object' && !Array.isArray(starter)) {
                if (Array.isArray(starter.questions)) {
                    await configurations.updateOne(
                        { _id: config._id },
                        { $set: { starterQuestion: starter.questions } }
                    );
                    console.log(`Updated starterQuestion for _id: ${config._id}`);
                }
            }
        }

    } catch (error) {
        console.error("starterQuestion migration failed:", error);
    } finally {
        await client.close();
    }
}

migrateStarterQuestion().catch(console.error);
