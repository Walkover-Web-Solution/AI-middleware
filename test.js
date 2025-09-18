import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority');

// Function to recursively add additionalProperties: false to schema objects that have required arrays
function addAdditionalPropertiesToSchema(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => addAdditionalPropertiesToSchema(item));
    }
    
    const updatedObj = { ...obj };
    
    // If this object has a 'required' array and doesn't already have additionalProperties, add it
    if (Array.isArray(updatedObj.required) && !updatedObj.hasOwnProperty('additionalProperties')) {
        updatedObj.additionalProperties = false;
    }
    
    // Recursively process all nested objects
    for (const key in updatedObj) {
        if (updatedObj.hasOwnProperty(key) && typeof updatedObj[key] === 'object') {
            updatedObj[key] = addAdditionalPropertiesToSchema(updatedObj[key]);
        }
    }
    
    return updatedObj;
}

// Function to process a single document
async function processDocument(collection, doc) {
    try {
        const originalSchema = doc.configuration.response_type.json_schema;
        const updatedSchema = addAdditionalPropertiesToSchema(originalSchema);
        
        // Update the document with the modified schema
        await collection.updateOne(
            { _id: doc._id },
            { 
                $set: { 
                    "configuration.response_type.json_schema": updatedSchema 
                } 
            }
        );
        
        console.log(`Updated schema for document _id: ${doc._id} in collection: ${collection.collectionName}`);
        return true;
    } catch (error) {
        console.error(`Error processing document _id: ${doc._id} in collection: ${collection.collectionName}`, error);
        return false;
    }
}

try {
    await client.connect();
    const db = client.db("AI_Middleware");
    
    const configuration_versions = db.collection("configuration_versions");
    const configurations = db.collection("configurations");
    
    // Query criteria for both collections
    const query = {
        "configuration.response_type": { "$exists": true },
        "configuration.response_type.type": "json_schema",
        "service": "openai"
    };
    
    let totalUpdated = 0;
    
    // Process configuration_versions collection
    console.log("Processing configuration_versions collection...");
    const configVersionsCursor = configuration_versions.find(query);
    while (await configVersionsCursor.hasNext()) {
        const doc = await configVersionsCursor.next();
        const success = await processDocument(configuration_versions, doc);
        if (success) totalUpdated++;
    }
    
    // Process configurations collection
    console.log("Processing configurations collection...");
    const configurationsCursor = configurations.find(query);
    while (await configurationsCursor.hasNext()) {
        const doc = await configurationsCursor.next();
        const success = await processDocument(configurations, doc);
        if (success) totalUpdated++;
    }
    
    console.log(`Migration completed successfully. Total documents updated: ${totalUpdated}`);
    
} catch (error) {
    console.error("Schema migration failed:", error);
} finally {
    await client.close();
}