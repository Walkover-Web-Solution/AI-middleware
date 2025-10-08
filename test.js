import { MongoClient } from 'mongodb';

// Your connection string
const uri = 'mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority';
const client = new MongoClient(uri);

// --- Configuration ---

// This map defines the FIRST choice for a fallback model.
const fallbackModelMap = {
    openai: 'gpt-5',
    google: 'gemini-2.5-flash',
    anthropic: 'claude-sonnet-4-20250514',
    groq: 'llama-3.3-70b-versatile',
    mistral: 'mistral-medium-latest',
    open_router: 'openai/gpt-4o',
    ai_ml: 'gpt-oss-20b'
};

// This map defines the SECOND choice if the first choice is the same as the primary model.
const secondChoiceFallbackMap = {
    openai: 'gpt-4o',
    google: 'gemini-2.5-pro',
    anthropic: 'claude-3-7-sonnet-latest',
    groq: 'llama-3.1-8b-instant',
    mistral: 'magistral-medium-latest',
    open_router: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
    ai_ml: 'gpt-oss-120b'
};


async function runMigration() {
    try {
        await client.connect();
        const db = client.db("AI_Middleware-test");
        console.log("Successfully connected to the database.");

        const collectionsToMigrate = ["configurations", "configuration_versions"];

        for (const collectionName of collectionsToMigrate) {
            console.log(`\n--- Starting migration for collection: ${collectionName} ---`);
            const collection = db.collection(collectionName);
            const cursor = collection.find({});

            let documentsProcessed = 0;
            while (await cursor.hasNext()) {
                const doc = await cursor.next();

                if (doc.fall_back || !doc.service || !doc.configuration?.model) {
                    continue; 
                }

                const primaryModel = doc.configuration.model;
                let proposedFallback = fallbackModelMap[doc.service];

                // If the primary model is the same as our first-choice fallback...
                if (primaryModel === proposedFallback) {
                    // ...then pick our second-choice fallback instead.
                    proposedFallback = secondChoiceFallbackMap[doc.service];
                }

                if (!proposedFallback) {
                    console.warn(`Warning: Could not determine a unique fallback for service "${doc.service}" in document _id: ${doc._id}. Skipping.`);
                    continue;
                }

                const newFallbackObject = {
                    is_enable: true,
                    service: doc.service,
                    model: proposedFallback
                };

                await collection.updateOne(
                    { _id: doc._id },
                    { $set: { fall_back: newFallbackObject } }
                );
                documentsProcessed++;
            }
            console.log(`Finished migration for ${collectionName}. Updated ${documentsProcessed} documents.`);
        }

    } catch (error) {
        console.error("An error occurred during the migration:", error);
    } finally {
        await client.close();
        console.log("\nDatabase connection closed.");
    }
}

runMigration();