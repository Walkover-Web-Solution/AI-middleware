import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority');
try {
    await client.connect();
    const db = client.db("AI_Middleware");
    const modelConfiguration = db.collection("modelconfiguration");
    
    // Find all documents in modelconfiguration collection
    const cursor = modelConfiguration.find({});
    
    while (await cursor.hasNext()) {
        const doc = await cursor.next();
        let updateNeeded = false;
        const updateOperations = {};
        
        // Check if service field exists and needs updating
        if (doc.service) {
            if (doc.service === 'openai') {
                // First update status from 1 to 0 for openai service
                if (doc.status === 1) {
                    updateOperations.status = 0;
                    updateNeeded = true;
                    console.log(`Updated status from 1 to 2 for document _id=${doc._id} with service='openai'`);
                }
                // Then swap service value from 'openai' to 'openai_response'
                updateOperations.service = 'openai_response';
                updateNeeded = true;
                console.log(`Swapped service from 'openai' to 'openai_response' for document _id=${doc._id}`);
            } else if (doc.service === 'openai_response') {
                // Swap service value from 'openai_response' to 'openai'
                updateOperations.service = 'openai';
                updateNeeded = true;
                console.log(`Swapped service from 'openai_response' to 'openai' for document _id=${doc._id}`);
            }
        }
        
        // Apply updates if needed
        if (updateNeeded) {
            await modelConfiguration.updateOne(
                { _id: doc._id },
                { $set: updateOperations }
            );
        }
    }
    
    console.log("Model configuration service migration completed successfully");
    
} catch (error) {
    console.error("Model configuration service migration failed:", error);
} finally {
    await client.close();
}