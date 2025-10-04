import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority');

try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db("AI_Middleware-test");
    const modelConfiguration = db.collection("modelconfigurations");
    
    // Find documents where service = 'anthropic' and response_type.default = 'default'
    const filter = {
        service: 'anthropic',
        'configuration.response_type.default': 'default'
    };
    
    // Update the response_type.default value
    const updateOperation = {
        $set: {
            'configuration.response_type.default': {
                "key": "type",
                "type": "json_schema"
            }
        }
    };
    
    // Execute the update
    const result = await modelConfiguration.updateMany(filter, updateOperation);
    
    console.log(`Migration completed successfully:`);
    console.log(`- Documents matched: ${result.matchedCount}`);
    console.log(`- Documents modified: ${result.modifiedCount}`);
    
    // Verify the changes
    const verificationCount = await modelConfiguration.countDocuments({
        service: 'anthropic',
        'configuration.response_type.default.key': 'type',
        'configuration.response_type.default.type': 'json_schema'
    });
    
    console.log(`- Documents with updated response_type.default: ${verificationCount}`);
    
} catch (error) {
    console.error("Response type migration failed:", error);
} finally {
    await client.close();
    console.log('MongoDB connection closed');
}
