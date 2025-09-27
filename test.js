import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority');

// Function to generate fallback configuration based on service and model
function generateFallbackConfig(service, currentModel) {
    const fallbackConfig = {
        is_enable: true,
        service: service,
        model: currentModel
    };

    switch (service) {
        case 'openai':
            if (currentModel === 'o3') {
                fallbackConfig.model = 'gpt-5';
            } else if (currentModel === 'gpt-4o') {
                fallbackConfig.model = 'gpt-4.1';
            }
            break;

        case 'anthropic':
            if (currentModel === 'claude-3-5-sonnet-latest') {
                fallbackConfig.model = 'claude-3-5-sonnet-20241022';
            } else {
                fallbackConfig.model = 'claude-3-5-sonnet-latest';
            }
            break;

        case 'gemini':
            if (currentModel === 'gemini-2.5-flash-lite-preview-06-17') {
                fallbackConfig.model = 'gemini-2.5-flash';
            } else if (currentModel === 'gemini-2.5-flash') {
                fallbackConfig.model = 'gemini-2.5-flash-lite-preview-06-17';
            } else {
                fallbackConfig.model = 'gemini-2.5-flash';
            }
            break;

        case 'open_router':
            if (currentModel === 'deepseek/deepseek-chat-v3-0324:free') {
                fallbackConfig.model = 'openai/gpt-4o';
            } else if (currentModel === 'openai/gpt-4o') {
                fallbackConfig.model = 'deepseek/deepseek-chat-v3-0324:free';
            } else {
                fallbackConfig.model = 'openai/gpt-4o';
            }
            break;

        case 'groq':
            if (currentModel === 'llama3-8b-8192') {
                fallbackConfig.model = 'llama3-70b-8192';
            } else {
                fallbackConfig.model = 'llama3-8b-8192';
            }
            break;

        case 'mistral':
            if (currentModel === 'mistral-small-2506') {
                fallbackConfig.model = 'magistral-small-2506';
            } else if (currentModel === 'magistral-small-2506') {
                fallbackConfig.model = 'mistral-small-2506';
            } else {
                fallbackConfig.model = 'magistral-small-2506';
            }
            break;

        case 'ai_ml':
            if (currentModel === 'gpt-oss-120b') {
                fallbackConfig.model = 'gpt-oss-20b';
            } else {
                fallbackConfig.model = 'gpt-oss-120b';
            }
            break;

        default:
            // For unknown services, keep the same model as fallback
            fallbackConfig.model = currentModel;
            break;
    }

    return fallbackConfig;
}

// Function to process a single document
async function processDocument(collection, doc, collectionName) {
    try {
        const service = doc.service;
        const currentModel = doc.configurations.model;
        
        if (!service || !currentModel) {
            console.log(`Skipping document ${doc._id} in ${collectionName}: missing service or model`);
            return;
        }

        // Check if fallback already exists
        if (doc.fall_back) {
            console.log(`Document ${doc._id} in ${collectionName} already has fallback configuration`);
            return;
        }

        const fallbackConfig = generateFallbackConfig(service, currentModel);
        
        await collection.updateOne(
            { _id: doc._id },
            { $set: { fall_back: fallbackConfig } }
        );

        console.log(`Added fallback configuration to ${collectionName} document ${doc._id}: ${service} -> ${fallbackConfig.model}`);
    } catch (error) {
        console.error(`Error processing document ${doc._id} in ${collectionName}:`, error);
    }
}

try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db("AI_Middleware");
    const configurations = db.collection("configurations");
    const configurationVersions = db.collection("configuration_versions");

    let processedCount = 0;

    // Process configurations collection
    console.log('\n--- Processing configurations collection ---');
    const configsCursor = configurations.find({});
    while (await configsCursor.hasNext()) {
        const doc = await configsCursor.next();
        await processDocument(configurations, doc, 'configurations');
        processedCount++;
    }

    // Process configuration_versions collection
    console.log('\n--- Processing configuration_versions collection ---');
    const versionsCursor = configurationVersions.find({});
    while (await versionsCursor.hasNext()) {
        const doc = await versionsCursor.next();
        await processDocument(configurationVersions, doc, 'configuration_versions');
        processedCount++;
    }

    console.log(`\n✅ Migration completed successfully! Processed ${processedCount} documents.`);

} catch (error) {
    console.error("❌ Fallback configuration migration failed:", error);
} finally {
    await client.close();
    console.log('Database connection closed');
}