import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority');

try {
    await client.connect();
    const db = client.db("AI_Middleware-test");
    const modelConfiguration = db.collection("modelconfigurations");
    
    console.log("Starting modelconfiguration level migration...");
    
    const cursor = modelConfiguration.find({});
    let updatedCount = 0;
    
    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        
        if (!doc.configuration || typeof doc.configuration !== 'object') {
            console.log(`Skipping document ${doc._id} - no configuration object found`);
            continue;
        }
        
        const updateOperations = {};
        let hasUpdates = false;
        
        // Iterate through all configuration keys
        for (const [key, configValue] of Object.entries(doc.configuration)) {
            if (configValue && typeof configValue === 'object' && 'level' in configValue) {
                let newLevel;
                
                // Set level based on key name
                if (key === 'max_tokens' || key === 'response_type') {
                    newLevel = 2;
                } else {
                    newLevel = 1;
                }
                
                // Only update if the level is different
                if (configValue.level !== newLevel) {
                    updateOperations[`configuration.${key}.level`] = newLevel;
                    hasUpdates = true;
                    console.log(`Document ${doc._id}: Setting ${key}.level from ${configValue.level} to ${newLevel}`);
                }
            }
        }
        
        // Apply updates if any
        if (hasUpdates) {
            await modelConfiguration.updateOne(
                { _id: doc._id },
                { $set: updateOperations }
            );
            updatedCount++;
            console.log(`Updated document ${doc._id} with ${Object.keys(updateOperations).length} field changes`);
        }
    }
    
    console.log(`Migration completed successfully. Updated ${updatedCount} documents.`);
    
} catch (error) {
    console.error("ModelConfiguration level migration failed:", error);
} finally {
    await client.close();
}
