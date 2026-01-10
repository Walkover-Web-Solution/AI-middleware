import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware-test';

// Function to check array composition
function analyzeArray(array) {
    if (!Array.isArray(array) || array.length === 0) {
        return { hasStrings: false, hasObjects: false, strings: [], objects: [] };
    }
    
    const strings = array.filter(item => typeof item === 'string');
    const objects = array.filter(item => typeof item === 'object' && item !== null);
    
    return {
        hasStrings: strings.length > 0,
        hasObjects: objects.length > 0,
        strings: strings,
        objects: objects
    };
}

async function migrateDocIds() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db("AI_Middleware-test");
        const collections = [
            { name: 'configurations', collection: db.collection("configurations") },
            { name: 'configuration_versions', collection: db.collection("configuration_versions") }
        ];
        
        let totalMigrated = 0;
        let totalSkipped = 0;
        
        for (const { name, collection } of collections) {
            console.log('\n' + '='.repeat(60));
            console.log(`Processing collection: ${name}`);
            console.log('='.repeat(60));
            
            // Find all documents that have doc_ids field
            const cursor = collection.find({
                doc_ids: { $exists: true, $ne: null }
            });
            
            let migratedCount = 0;
            let skippedCount = 0;
            
            while (await cursor.hasNext()) {
                const doc = await cursor.next();
                const docId = doc._id;
                
                console.log(`\nProcessing Document: ${docId}`);
                
                try {
                    // Check if doc_ids exists and has values
                    if (!doc.doc_ids || !Array.isArray(doc.doc_ids) || doc.doc_ids.length === 0) {
                        console.log(`  - doc_ids is empty or not an array, skipping`);
                        skippedCount++;
                        continue;
                    }
                    
                    // Analyze the array composition
                    const analysis = analyzeArray(doc.doc_ids);
                    
                    // Case 1: Only strings -> clear the array
                    if (analysis.hasStrings && !analysis.hasObjects) {
                        console.log(`  doc_ids contains only string values (${analysis.strings.length} items)`);
                        console.log(`  Examples: [${analysis.strings.slice(0, 2).map(id => `"${id}"`).join(', ')}${analysis.strings.length > 2 ? ', ...' : ''}]`);
                        console.log(`  Clearing doc_ids array...`);
                        
                        // Update the document to clear doc_ids
                        const result = await collection.updateOne(
                            { _id: docId },
                            {
                                $set: {
                                    doc_ids: [],
                                    updated_at: new Date()
                                }
                            }
                        );
                        
                        if (result.modifiedCount > 0) {
                            migratedCount++;
                            console.log(`  ✓ Successfully cleared doc_ids array`);
                        } else {
                            skippedCount++;
                            console.log(`  - No changes made`);
                        }
                    }
                    // Case 2: Only objects -> keep as is
                    else if (!analysis.hasStrings && analysis.hasObjects) {
                        console.log(`  doc_ids contains only object values (${analysis.objects.length} items)`);
                        console.log(`  Keeping doc_ids as is`);
                        skippedCount++;
                    }
                    // Case 3: Mixed strings and objects -> keep only objects
                    else if (analysis.hasStrings && analysis.hasObjects) {
                        console.log(`  doc_ids contains mixed values: ${analysis.strings.length} strings, ${analysis.objects.length} objects`);
                        console.log(`  Removing ${analysis.strings.length} string(s), keeping ${analysis.objects.length} object(s)`);
                        
                        // Update the document to keep only objects
                        const result = await collection.updateOne(
                            { _id: docId },
                            {
                                $set: {
                                    doc_ids: analysis.objects,
                                    updated_at: new Date()
                                }
                            }
                        );
                        
                        if (result.modifiedCount > 0) {
                            migratedCount++;
                            console.log(`  ✓ Successfully filtered doc_ids array`);
                        } else {
                            skippedCount++;
                            console.log(`  - No changes made`);
                        }
                    }
                    
                } catch (error) {
                    console.error(`  ✗ Error processing document ${docId}:`, error.message);
                }
            }
            
            console.log('\n' + '-'.repeat(60));
            console.log(`${name} Summary:`);
            console.log(`  Migrated: ${migratedCount}`);
            console.log(`  Skipped: ${skippedCount}`);
            console.log('-'.repeat(60));
            
            totalMigrated += migratedCount;
            totalSkipped += skippedCount;
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('Overall Migration Summary:');
        console.log(`  Total migrated: ${totalMigrated}`);
        console.log(`  Total skipped: ${totalSkipped}`);
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error("Migration failed:", error);
        throw error;
    } finally {
        await client.close();
        console.log('\nMongoDB connection closed');
    }
}

// Run the migration
migrateDocIds()
    .then(() => {
        console.log('\n✓ Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ Migration failed:', error);
        process.exit(1);
    });

