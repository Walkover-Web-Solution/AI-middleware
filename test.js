import { MongoClient, ObjectId } from 'mongodb';

const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware-test?retryWrites=true&w=majority');

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
async function processDocument(collection, doc, updatedIds) {
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
        
        // Add the document ID to the list for cache deletion
        updatedIds.push(doc._id.toString());
        
        console.log(`Updated schema for document _id: ${doc._id} in collection: ${collection.collectionName}`);
        return true;
    } catch (error) {
        console.error(`Error processing document _id: ${doc._id} in collection: ${collection.collectionName}`, error);
        return false;
    }
}

// Function to delete cache entries via API
async function deleteCacheEntries(ids) {
    if (ids.length === 0) {
        console.log('No cache entries to delete');
        return;
    }

    try {
        const response = await fetch('https://dev-api.gtwy.ai/utils/redis/', {
            method: 'DELETE',
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'content-type': 'application/json',
                'origin': 'https://dev-ai.viasocket.com',
                'priority': 'u=1, i',
                'proxy_auth_token': 'bzlqM2xmYmovaUhHR2w2eTJBR0c1S1ZObEFSeCs4aStUTjVYQUFVQnRxaCtTakd5SWw5bWhpbHg1SlJHN3VIVWpWeFNKVmpNV1FqZWFla1NnSXd4alFSWWVtUU5Uc0pMZVozZVBEdk5acjlZL3IyTGZ5R1NyOHdYSU94a013SnpLQlIyMFFUTTNxMmE1TGh5N1BucGdzVnR1bG1ZQ202c2NvajBERFVHdTM4PQ==',
                'referer': 'https://dev-ai.viasocket.com/',
                'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({
                ids: ids
            })
        });

        if (response.ok) {
            console.log(`Successfully deleted ${ids.length} cache entries via API`);
            console.log(`Deleted cache keys: ${ids.join(', ')}`);
        } else {
            console.error(`Failed to delete cache entries. Status: ${response.status}`);
            const errorText = await response.text();
            console.error('Error response:', errorText);
        }
    } catch (error) {
        console.error('Error calling cache deletion API:', error);
    }
}

try {
    await client.connect();
    const db = client.db("AI_Middleware-test");
    
    const configuration_versions = db.collection("configuration_versions");
    const configurations = db.collection("configurations");
    
    // Query criteria for both collections
    const query = {
        "configuration.response_type": { "$exists": true },
        "configuration.response_type.type": "json_schema",
        "service": "openai"
    };
    
    let totalUpdated = 0;
    const updatedDocumentIds = []; // Array to collect all updated document IDs
    
    // Process configuration_versions collection
    console.log("Processing configuration_versions collection...");
    const configVersionsCursor = configuration_versions.find(query);
    while (await configVersionsCursor.hasNext()) {
        const doc = await configVersionsCursor.next();
        const success = await processDocument(configuration_versions, doc, updatedDocumentIds);
        if (success) totalUpdated++;
    }
    
    // Process configurations collection
    console.log("Processing configurations collection...");
    const configurationsCursor = configurations.find(query);
    while (await configurationsCursor.hasNext()) {
        const doc = await configurationsCursor.next();
        const success = await processDocument(configurations, doc, updatedDocumentIds);
        if (success) totalUpdated++;
    }
    
    console.log(`Migration completed successfully. Total documents updated: ${totalUpdated}`);
    
    // Delete all cache entries in a single API call
    console.log(`\nDeleting cache entries for ${updatedDocumentIds.length} documents...`);
    await deleteCacheEntries(updatedDocumentIds);
    
} catch (error) {
    console.error("Schema migration failed:", error);
} finally {
    await client.close();
}