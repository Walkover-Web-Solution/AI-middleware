import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware-test';

async function cleanupOrphanedRagData() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db("AI_Middleware-test");
        const ragDataCollection = db.collection("rag_data");
        const ragParentDatasCollection = db.collection("rag_parent_datas");
        
        // Get all parent IDs for efficient lookup
        console.log('\nFetching all parent document IDs from rag_parent_datas...');
        const parentIds = await ragParentDatasCollection
            .find({}, { projection: { _id: 1 } })
            .toArray();
        
        // Create a Set of parent IDs (as strings) for O(1) lookup
        const parentIdSet = new Set(parentIds.map(doc => doc._id.toString()));
        console.log(`Found ${parentIdSet.size} parent documents`);
        
        // Find all rag_data documents
        console.log('\nFetching all rag_data documents...');
        const ragDataCursor = ragDataCollection.find({});
        const totalRagData = await ragDataCollection.countDocuments();
        console.log(`Found ${totalRagData} rag_data documents to process`);
        
        let deletedCount = 0;
        let keptCount = 0;
        let errorCount = 0;
        const orphanedIds = [];
        
        console.log('\n' + '='.repeat(60));
        console.log('Processing rag_data documents...');
        console.log('='.repeat(60));
        
        while (await ragDataCursor.hasNext()) {
            const ragDataDoc = await ragDataCursor.next();
            const ragDataId = ragDataDoc._id;
            const docId = ragDataDoc.doc_id;
            
            try {
                if (!docId) {
                    console.log(`\n⚠️  Document ${ragDataId} has no doc_id field - marking for deletion`);
                    orphanedIds.push(ragDataId);
                    continue;
                }
                
                // Check if doc_id exists in parent collection
                const docIdString = typeof docId === 'string' ? docId : docId.toString();
                
                if (parentIdSet.has(docIdString)) {
                    // Parent exists, keep this document
                    keptCount++;
                    if (keptCount % 100 === 0) {
                        console.log(`✓ Processed ${keptCount} valid documents...`);
                    }
                } else {
                    // Parent doesn't exist, mark for deletion
                    console.log(`\n✗ Document ${ragDataId} is orphaned (doc_id: ${docId}) - marking for deletion`);
                    orphanedIds.push(ragDataId);
                }
                
            } catch (error) {
                console.error(`\n❌ Error processing document ${ragDataId}:`, error.message);
                errorCount++;
            }
        }
        
        // Perform batch deletion of orphaned records
        if (orphanedIds.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log(`Deleting ${orphanedIds.length} orphaned documents...`);
            console.log('='.repeat(60));
            
            const deleteResult = await ragDataCollection.deleteMany({
                _id: { $in: orphanedIds }
            });
            
            deletedCount = deleteResult.deletedCount;
            console.log(`✓ Successfully deleted ${deletedCount} orphaned documents`);
        } else {
            console.log('\n✓ No orphaned documents found');
        }
        
        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('CLEANUP SUMMARY:');
        console.log('='.repeat(60));
        console.log(`  Total rag_data documents processed: ${totalRagData}`);
        console.log(`  Total parent documents found: ${parentIdSet.size}`);
        console.log(`  Documents kept (with valid parent): ${keptCount}`);
        console.log(`  Documents deleted (orphaned): ${deletedCount}`);
        console.log(`  Errors encountered: ${errorCount}`);
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error("\n❌ Cleanup failed:", error);
        throw error;
    } finally {
        await client.close();
        console.log('\nMongoDB connection closed');
    }
}

// Run the cleanup
cleanupOrphanedRagData()
    .then(() => {
        console.log('\n✓ Cleanup completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ Cleanup failed:', error);
        process.exit(1);
    });

