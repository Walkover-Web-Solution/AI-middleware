import { MongoClient } from 'mongodb';

// Your connection string
const uri = 'mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority';
const client = new MongoClient(uri);

// --- Configuration ---

// This map defines the FIRST choice for a fallback model.
const fallbackModelMap = {
    openai: 'gpt-4o',
    gemini: 'gemini-1.5-flash',
    anthropic: 'claude-3-haiku-20240307',
    groq: 'llama3-8b-8192',
    mistral: 'mistral-small-latest',
    open_router: 'openai/gpt-4o',
    ai_ml: 'gpt-4o'
};

// This map defines the SECOND choice if the first choice is the same as the primary model.
const secondChoiceFallbackMap = {
    openai: 'gpt-4-turbo', // If primary is gpt-4o, use gpt-4-turbo
    gemini: 'gemini-1.5-pro', // If primary is flash, use pro
    anthropic: 'claude-3-sonnet-20240229', // If primary is haiku, use sonnet
    groq: 'gemma-7b-it', // If primary is llama3, use gemma
    mistral: 'mistral-medium-latest', // If primary is small, use medium
    open_router: 'anthropic/claude-3-haiku',
    ai_ml: 'gpt-4-turbo'
};


async function runMigration() {
    try {
        await client.connect();
        const db = client.db("AI_Middleware");
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