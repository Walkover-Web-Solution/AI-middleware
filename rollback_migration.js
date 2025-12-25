import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority';

/**
 * ROLLBACK SCRIPT
 * 
 * This script rolls back the v2 migration by restoring the original fields
 * from the old_fields backup.
 * 
 * ⚠️  WARNING: Only run this if you need to revert the migration!
 */

async function rollbackApiCallsV2Migration() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        console.log('\n⚠️  WARNING: This will rollback the v2 migration!');
        console.log('Press Ctrl+C within 5 seconds to cancel...\n');
        
        // Give user time to cancel
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const db = client.db("AI_Middleware");
        const apiCalls = db.collection("apicalls");
        
        // Find all v2 documents that have old_fields backup
        const cursor = apiCalls.find({
            version: "v2",
            old_fields: { $exists: true, $ne: null }
        });
        
        let rolledBackCount = 0;
        let skippedCount = 0;
        
        while (await cursor.hasNext()) {
            const apiCall = await cursor.next();
            const apiCallId = apiCall._id;
            
            console.log(`\nRolling back API Call: ${apiCallId} (${apiCall.function_name})`);
            
            try {
                const updateDoc = {
                    $set: {
                        fields: apiCall.old_fields,
                        updated_at: new Date()
                    },
                    $unset: {
                        version: "",
                        old_fields: "",
                        status: ""
                    }
                };
                
                // Optionally restore bridge_id from bridge_ids
                if (Array.isArray(apiCall.bridge_ids) && apiCall.bridge_ids.length > 0) {
                    const firstBridgeId = apiCall.bridge_ids[0];
                    updateDoc.$set.bridge_id = firstBridgeId.toString();
                    updateDoc.$set.bridge_ids = [];
                }
                
                const result = await apiCalls.updateOne(
                    { _id: apiCallId },
                    updateDoc
                );
                
                if (result.modifiedCount > 0) {
                    rolledBackCount++;
                    console.log(`  ✓ Successfully rolled back`);
                } else {
                    skippedCount++;
                    console.log(`  - No changes needed`);
                }
                
            } catch (error) {
                console.error(`  ✗ Error rolling back API Call ${apiCallId}:`, error.message);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('Rollback Summary:');
        console.log(`  Total rolled back: ${rolledBackCount}`);
        console.log(`  Total skipped: ${skippedCount}`);
        console.log('='.repeat(60));
        
        // Check for documents without old_fields backup
        const noBackupCount = await apiCalls.countDocuments({
            version: "v2",
            $or: [
                { old_fields: { $exists: false } },
                { old_fields: null },
                { old_fields: {} }
            ]
        });
        
        if (noBackupCount > 0) {
            console.log(`\n⚠️  Warning: ${noBackupCount} documents don't have old_fields backup`);
            console.log('   These documents were likely created after migration and cannot be rolled back.');
        }
        
    } catch (error) {
        console.error("Rollback failed:", error);
        throw error;
    } finally {
        await client.close();
        console.log('\nMongoDB connection closed');
    }
}

// Uncomment to run rollback
// rollbackApiCallsV2Migration()
//     .then(() => {
//         console.log('\n✓ Rollback completed successfully');
//         process.exit(0);
//     })
//     .catch((error) => {
//         console.error('\n✗ Rollback failed:', error);
//         process.exit(1);
//     });

console.log('⚠️  Rollback script loaded but not executed.');
console.log('To run rollback, uncomment the lines at the bottom of this file.');

export { rollbackApiCallsV2Migration };

