import { MongoClient, ObjectId } from 'mongodb';
import axios from 'axios';

const MONGODB_URI = 'mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware-test';
const HIPPOCAMPUS_URL = 'http://hippocampus.gtwy.ai';
const HIPPOCAMPUS_API_KEY = process.env.HIPPOCAMPUS_API_KEY;

// Default collection settings
const DEFAULT_COLLECTIONS = {
    high_accuracy: {
        name: "high_accuracy",
        settings: {
            denseModel: "BAAI/bge-large-en-v1.5",
            sparseModel: "Qdrant/bm25",
            rerankerModel: "colbert-ir/colbertv2.0"
        }
    },
    moderate: {
        name: "moderate",
        settings: {
            denseModel: "BAAI/bge-large-en-v1.5"
        }
    },
    fastest: {
        name: "fastest",
        settings: {
            denseModel: "BAAI/bge-small-en-v1.5"
        }
    }
};

// Supported chunking types
const SUPPORTED_CHUNKING_TYPES = ['recursive', 'semantic', 'agentic', 'custom'];

// Track migration results
const migrationLog = {
    totalProcessed: 0,
    successful: 0,
    failed: [],
    collectionCreationErrors: [],
    resourceCreationErrors: [],
    agentUpdateErrors: []
};

/**
 * Normalize chunking type to supported values
 */
function normalizeChunkingType(chunkingType) {
    if (!chunkingType || !SUPPORTED_CHUNKING_TYPES.includes(chunkingType)) {
        return 'semantic'; // Default fallback
    }
    return chunkingType;
}

/**
 * Check if collection exists with matching settings
 */
function findMatchingCollection(collections, targetName, targetSettings) {
    return collections.find(col => {
        const colSettings = col.settings || {};
        
        if (col.name !== targetName) {
            return false;
        }
        
        // Check if all required models match based on collection type
        if (targetName === 'high_accuracy') {
            return colSettings.denseModel === targetSettings.denseModel && 
                   colSettings.sparseModel === targetSettings.sparseModel && 
                   colSettings.rerankerModel === targetSettings.rerankerModel;
        } else if (targetName === 'moderate') {
            return colSettings.denseModel === targetSettings.denseModel;
        } else if (targetName === 'fastest') {
            return colSettings.denseModel === targetSettings.denseModel;
        }
        
        return false;
    });
}

/**
 * Generate unique collection ID
 */
function generateCollectionId() {
    return new ObjectId().toString();
}

/**
 * Create or get collection for org
 */
async function ensureCollectionExists(db, orgId) {
    try {
        const ragCollections = db.collection("rag_collections");
        
        // Get all collections for this org
        const existingCollections = await ragCollections.find({ org_id: orgId }).toArray();
        
        // Check if high_accuracy collection exists with correct settings
        const highAccuracyConfig = DEFAULT_COLLECTIONS.high_accuracy;
        let matchingCollection = findMatchingCollection(
            existingCollections, 
            'high_accuracy', 
            highAccuracyConfig.settings
        );
        
        if (matchingCollection) {
            console.log(`  ✓ Found existing high_accuracy collection: ${matchingCollection.collection_id}`);
            return matchingCollection.collection_id;
        }
        
        // Create new high_accuracy collection
        const collectionId = generateCollectionId();
        const newCollection = {
            collection_id: collectionId,
            name: 'high_accuracy',
            org_id: orgId,
            resource_ids: [],
            settings: highAccuracyConfig.settings,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        await ragCollections.insertOne(newCollection);
        console.log(`  ✓ Created new high_accuracy collection: ${collectionId}`);
        
        return collectionId;
    } catch (error) {
        console.error(`  ✗ Error ensuring collection exists for org ${orgId}:`, error.message);
        migrationLog.collectionCreationErrors.push({
            org_id: orgId,
            error: error.message
        });
        throw error;
    }
}

/**
 * Create resource in Hippocampus
 */
async function createResource(collectionId, docData, ownerId) {
    try {
        const chunkingStrategy = normalizeChunkingType(docData.chunking_type);
        
        // Prepare settings with chunking configuration
        const settings = {
            chunkSize: docData.chunk_size || 1000,
            chunkOverlap: docData.chunk_overlap || 100,
            strategy: chunkingStrategy
        };
        
        // Prepare resource data
        const resourcePayload = {
            _id: docData._id.toString(), // Send the old document _id to preserve it
            collectionId,
            title: docData.name || 'Untitled Resource',
            description: docData.description || '',
            ownerId: ownerId || 'public',
            settings
        };
        
        // Priority 1: Use content if present
        if (docData.content !== undefined && docData.content !== null && docData.content !== '') {
            resourcePayload.content = docData.content;
            resourcePayload.url = ''; // Set empty URL when using content
            console.log(`  → Using content from document (content length: ${typeof docData.content === 'string' ? docData.content.length : 'N/A'})`);
        } 
        // Priority 2: Use URL if content is not available
        else {
            const sourceUrl = docData.source?.data?.url || docData.source?.url || '';
            resourcePayload.url = sourceUrl;
            
            if (sourceUrl) {
                console.log(`  → Using URL: ${sourceUrl}`);
            } else {
                console.log(`  → Warning: No content or URL found, sending empty content`);
                resourcePayload.content = '';
            }
        }
        
        const response = await axios.post(
            `${HIPPOCAMPUS_URL}/resource`,
            resourcePayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': HIPPOCAMPUS_API_KEY
                },
                timeout: 30000 // 30 seconds timeout
            }
        );
        
        if (response.data && response.data._id) {
            return response.data._id;
        }
        
        throw new Error('No resource ID returned from Hippocampus');
    } catch (error) {
        console.error(`  ✗ Error creating resource:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Add resource ID to collection
 */
async function addResourceToCollection(db, collectionId, resourceId) {
    try {
        const ragCollections = db.collection("rag_collections");
        
        await ragCollections.updateOne(
            { collection_id: collectionId },
            { 
                $addToSet: { resource_ids: resourceId },
                $set: { updated_at: new Date() }
            }
        );
        
        console.log(`  ✓ Added resource ${resourceId} to collection ${collectionId}`);
    } catch (error) {
        console.error(`  ✗ Error adding resource to collection:`, error.message);
        throw error;
    }
}

/**
 * Update agent doc_ids with new structure
 */
async function updateAgentDocIds(db, oldDocId, collectionId, resourceId, description) {
    const updateErrors = [];
    
    try {
        // Update in bridgeversions collection
        const bridgeVersions = db.collection("bridgeversions");
        const bridgeDocsToUpdate = await bridgeVersions.find({
            doc_ids: oldDocId
        }).toArray();
        
        for (const bridgeDoc of bridgeDocsToUpdate) {
            try {
                // Find the old doc_id in the array
                const newDocIds = (bridgeDoc.doc_ids || []).map(docId => {
                    if (docId === oldDocId || docId.toString() === oldDocId.toString()) {
                        return {
                            collection_id: collectionId,
                            resource_id: resourceId,
                            description: description || 'Migrated from old RAG structure'
                        };
                    }
                    // If already an object, keep it as is
                    if (typeof docId === 'object' && docId.collection_id) {
                        return docId;
                    }
                    // Keep string IDs that don't match
                    return docId;
                });
                
                await bridgeVersions.updateOne(
                    { _id: bridgeDoc._id },
                    { 
                        $set: { 
                            doc_ids: newDocIds,
                            updated_at: new Date()
                        }
                    }
                );
                
                console.log(`    ✓ Updated bridgeversion ${bridgeDoc._id}`);
            } catch (error) {
                console.error(`    ✗ Error updating bridgeversion ${bridgeDoc._id}:`, error.message);
                updateErrors.push({
                    collection: 'bridgeversions',
                    document_id: bridgeDoc._id,
                    error: error.message
                });
            }
        }
        
        // Update in configurations collection
        const configurations = db.collection("configurations");
        const configDocsToUpdate = await configurations.find({
            doc_ids: oldDocId
        }).toArray();
        
        for (const configDoc of configDocsToUpdate) {
            try {
                // Find the old doc_id in the array
                const newDocIds = (configDoc.doc_ids || []).map(docId => {
                    if (docId === oldDocId || docId.toString() === oldDocId.toString()) {
                        return {
                            collection_id: collectionId,
                            resource_id: resourceId,
                            description: description || 'Migrated from old RAG structure'
                        };
                    }
                    // If already an object, keep it as is
                    if (typeof docId === 'object' && docId.collection_id) {
                        return docId;
                    }
                    // Keep string IDs that don't match
                    return docId;
                });
                
                await configurations.updateOne(
                    { _id: configDoc._id },
                    { 
                        $set: { 
                            doc_ids: newDocIds,
                            updated_at: new Date()
                        }
                    }
                );
                
                console.log(`    ✓ Updated configuration ${configDoc._id}`);
            } catch (error) {
                console.error(`    ✗ Error updating configuration ${configDoc._id}:`, error.message);
                updateErrors.push({
                    collection: 'configurations',
                    document_id: configDoc._id,
                    error: error.message
                });
            }
        }
        
    } catch (error) {
        console.error(`  ✗ Error updating agent doc_ids:`, error.message);
        updateErrors.push({
            general_error: error.message
        });
    }
    
    return updateErrors;
}

/**
 * Main migration function
 */
async function migrateRagToNewCollection() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        console.log('Starting RAG migration to new collection structure...\n');
        
        const db = client.db("AI_Middleware-test");
        const ragParentDatas = db.collection("rag_parent_datas");
        
        // Get all documents
        const cursor = ragParentDatas.find({});
        
        while (await cursor.hasNext()) {
            const doc = await cursor.next();
            migrationLog.totalProcessed++;
            
            console.log(`\n${'='.repeat(80)}`);
            console.log(`Processing Document [${migrationLog.totalProcessed}]: ${doc._id}`);
            console.log(`  Name: ${doc.name || 'N/A'}`);
            console.log(`  Org ID: ${doc.org_id}`);
            console.log(`  Chunking Type: ${doc.chunking_type}`);
            console.log(`${'='.repeat(80)}`);
            
            try {
                // Step 1: Ensure collection exists for org
                console.log(`\nStep 1: Ensuring high_accuracy collection exists for org ${doc.org_id}...`);
                const collectionId = await ensureCollectionExists(db, doc.org_id);
                
                // Step 2: Determine ownerId
                let ownerId;
                if (doc.folder_id && doc.user_id) {
                    ownerId = `${doc.org_id}_${doc.folder_id}_${doc.user_id}`;
                } else if (doc.user_id) {
                    ownerId = `${doc.org_id}_${doc.user_id}`;
                } else {
                    ownerId = doc.org_id;
                }
                
                // Step 3: Create resource in Hippocampus
                console.log(`\nStep 2: Creating resource in Hippocampus...`);
                const resourceId = await createResource(collectionId, doc, ownerId);
                console.log(`  ✓ Resource created: ${resourceId}`);
                
                // Step 4: Add resource to collection
                console.log(`\nStep 3: Adding resource to collection...`);
                await addResourceToCollection(db, collectionId, resourceId);
                
                // Step 5: Update agent doc_ids
                console.log(`\nStep 4: Updating agent doc_ids...`);
                const updateErrors = await updateAgentDocIds(
                    db, 
                    doc._id.toString(), 
                    collectionId, 
                    resourceId,
                    doc.description
                );
                
                if (updateErrors.length > 0) {
                    migrationLog.agentUpdateErrors.push({
                        doc_id: doc._id.toString(),
                        errors: updateErrors
                    });
                }
                
                migrationLog.successful++;
                console.log(`\n✓ Successfully migrated document ${doc._id}`);
                
            } catch (error) {
                console.error(`\n✗ Failed to migrate document ${doc._id}:`, error.message);
                migrationLog.failed.push({
                    doc_id: doc._id.toString(),
                    name: doc.name,
                    org_id: doc.org_id,
                    error: error.message,
                    stack: error.stack
                });
                
                // Continue with next document
                continue;
            }
        }
        
        // Print final summary
        console.log('\n\n' + '='.repeat(80));
        console.log('MIGRATION SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Documents Processed: ${migrationLog.totalProcessed}`);
        console.log(`Successfully Migrated: ${migrationLog.successful}`);
        console.log(`Failed: ${migrationLog.failed.length}`);
        console.log(`Collection Creation Errors: ${migrationLog.collectionCreationErrors.length}`);
        console.log(`Resource Creation Errors: ${migrationLog.resourceCreationErrors.length}`);
        console.log(`Agent Update Errors: ${migrationLog.agentUpdateErrors.length}`);
        console.log('='.repeat(80));
        
        // Print detailed error logs
        if (migrationLog.failed.length > 0) {
            console.log('\n\nFAILED DOCUMENTS:');
            console.log('='.repeat(80));
            migrationLog.failed.forEach((failure, index) => {
                console.log(`\n${index + 1}. Document ID: ${failure.doc_id}`);
                console.log(`   Name: ${failure.name}`);
                console.log(`   Org ID: ${failure.org_id}`);
                console.log(`   Error: ${failure.error}`);
            });
        }
        
        if (migrationLog.agentUpdateErrors.length > 0) {
            console.log('\n\nAGENT UPDATE ERRORS:');
            console.log('='.repeat(80));
            migrationLog.agentUpdateErrors.forEach((error, index) => {
                console.log(`\n${index + 1}. Document ID: ${error.doc_id}`);
                console.log(`   Errors: ${JSON.stringify(error.errors, null, 2)}`);
            });
        }
        
        // Save error log to file
        if (migrationLog.failed.length > 0 || migrationLog.agentUpdateErrors.length > 0) {
            const fs = await import('fs');
            const errorLogPath = './migration_errors.json';
            fs.writeFileSync(errorLogPath, JSON.stringify(migrationLog, null, 2));
            console.log(`\n\n✓ Error log saved to: ${errorLogPath}`);
            console.log('You can use this file to rerun failed migrations.');
        }
        
    } catch (error) {
        console.error('\n\nCRITICAL ERROR:', error);
        throw error;
    } finally {
        await client.close();
        console.log('\n\nMongoDB connection closed');
    }
}

// Run the migration
migrateRagToNewCollection()
    .then(() => {
        console.log('\n✓ Migration completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ Migration failed:', error);
        process.exit(1);
    });
