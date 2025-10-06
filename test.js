import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority');

async function migrateGroqModel() {
    try {
        await client.connect();
        const db = client.db("AI_Middleware");
        
        // Collections to update
        const configurations = db.collection("configurations");
        const configuration_versions = db.collection("configuration_versions");
        
        const oldModel = 'llama3-70b-8192';
        const newModel = 'llama-3.3-70b-versatile';
        
        console.log('Starting Groq model migration...');
        
        // Update configurations collection
        console.log('Updating configurations collection...');
        const configResult = await configurations.updateMany(
            { 
                service: 'groq',
                'configuration.model': oldModel
            },
            { 
                $set: { 'configuration.model': newModel }
            }
        );
        console.log(`Updated ${configResult.modifiedCount} documents in configurations collection`);
        
        // Update configuration_versions collection
        console.log('Updating configuration_versions collection...');
        const versionResult = await configuration_versions.updateMany(
            { 
                service: 'groq',
                'configuration.model': oldModel
            },
            { 
                $set: { 'configuration.model': newModel }
            }
        );
        console.log(`Updated ${versionResult.modifiedCount} documents in configuration_versions collection`);
        
        console.log('Groq model migration completed successfully!');
        console.log(`Total documents updated: ${configResult.modifiedCount + versionResult.modifiedCount}`);
        
    } catch (error) {
        console.error("Groq model migration failed:", error);
        throw error;
    } finally {
        await client.close();
    }
}

// Run the migration
migrateGroqModel();