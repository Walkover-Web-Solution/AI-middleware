import { MongoClient, ObjectId } from 'mongodb';
import axios from 'axios';
import fs from 'fs';

const MONGODB_URI = 'mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware-test';
const HIPPOCAMPUS_URL = 'http://hippocampus.gtwy.ai';
const HIPPOCAMPUS_API_KEY = 'IDUfK3NqTdp2T5dlscfg3YH2tos3gzi0';

console.log('✓ Configuration loaded');
console.log(`✓ Using Hippocampus URL: ${HIPPOCAMPUS_URL}`);
console.log(`✓ API Key: ${HIPPOCAMPUS_API_KEY.substring(0, 10)}...`);

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

// Specific user IDs map for ownerId determination
const SPECIFIC_USER_IDS = {
    '13097': '13097',
    '17228': '17228',
    '17235': '17235',
    '17236': '17236',
    '17237': '17237',
    '17238': '17238',
    '17321': '17321',
    '17903': '17903',
    '19270': '19270',
    '19305': '19305',
    '19717': '19717',
    '19718': '19718',
    '20100': '20100',
    '20199': '20199',
    '20720': '20720',
    '21297': '21297',
    '21390': '21390',
    '21690': '21690',
    '21800': '21800',
    '22573': '22573',
    '22671': '22671',
    '39477': '39477',
    '41598': '41598',
    '41627': '41627',
    '41631': '41631',
    '41633': '41633',
    '41743': '41743',
    '41752': '41752',
    '53187': '53187',
    '62514': '62514',
    '62863': '62863',
    '62870': '62870',
    '63053': '63053',
    '63191': '63191',
    '63483': '63483',
    '63651': '63651',
    '66532': '66532',
    '66568': '66568',
    '70980': '70980',
    '71379': '71379',
    '71382': '71382',
    '71383': '71383',
    '71385': '71385',
    '71387': '71387',
    '72452': '72452',
    '73831': '73831',
    '75676': '75676',
    '75678': '75678',
    '76023': '76023',
    '76557': '76557',
    '76580': '76580',
    '76840': '76840',
    '77381': '77381',
    '77649': '77649',
    '77729': '77729',
    '78224': '78224',
    '78269': '78269',
    '78350': '78350',
    '78362': '78362',
    '78482': '78482',
    '78488': '78488',
    '78942': '78942',
    '79005': '79005',
    '79053': '79053',
    '79318': '79318',
    '79336': '79336',
    '79340': '79340',
    '79341': '79341',
    '79342': '79342',
    '79343': '79343',
    '79363': '79363',
    '79364': '79364',
    '79482': '79482',
    '81862': '81862',
    '81906': '81906',
    '82001': '82001',
    '82003': '82003',
    '82004': '82004',
    '82007': '82007',
    '82428': '82428',
    '82434': '82434',
    '82775': '82775',
    '82778': '82778',
    '83278': '83278',
    '83374': '83374',
    '83500': '83500',
    '83706': '83706',
    '84021': '84021',
    '84025': '84025',
    '84227': '84227',
    '84390': '84390',
    '85157': '85157',
    '85647': '85647',
    '85697': '85697',
    '86459': '86459',
    '86870': '86870',
    '87450': '87450',
    '87452': '87452',
    '87453': '87453',
    '87456': '87456',
    '87457': '87457',
    '87462': '87462',
    '87463': '87463',
    '87466': '87466',
    '87467': '87467',
    '87468': '87468',
    '87472': '87472',
    '87473': '87473'
};

// Track migration results
const retryLog = {
    totalProcessed: 0,
    successful: 0,
    failed: [],
    skipped: [],
    resourceAlreadyExists: 0,
    resourceCreated: 0,
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
 * Create or get rag_folder for a specific org and user
 */
async function ensureRagFolderExists(db, orgId, userId) {
    try {
        const Folders = db.collection("folders");
        
        // Check if folder already exists for this org_id
        const existingFolder = await Folders.findOne({ org_id: orgId, type:"rag_embed" });
        
        if (existingFolder) {
            console.log(`  ✓ Found existing rag_embed: ${existingFolder._id} for org: ${orgId}`);
            return existingFolder._id.toString();
        }
        
        // Create new rag_folder
        const newFolder = {
            org_id: orgId,
            name: 'rag',
            type: 'rag_embed',
            created_at: new Date(),
            updated_at: new Date()
        };
        
        const result = await Folders.insertOne(newFolder);
        const folderId = result.insertedId.toString();
        console.log(`  ✓ Created new rag_embed: ${folderId} for org: ${orgId}`);
        
        return folderId;
    } catch (error) {
        console.error(`  ✗ Error ensuring rag_embed exists for org ${orgId}:`, error.message);
        throw error;
    }
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
        
        // Create new high_accuracy collection via Hippocampus API
        console.log(`  → Creating new high_accuracy collection via Hippocampus API...`);
        
        const collectionPayload = {
            name: 'high_accuracy',
            settings: {
                denseModel: highAccuracyConfig.settings.denseModel,
                sparseModel: highAccuracyConfig.settings.sparseModel,
                rerankerModel: highAccuracyConfig.settings.rerankerModel,
                chunkSize: 1000,
                chunkOverlap: 100
            }
        };
        
        const response = await axios.post(
            `${HIPPOCAMPUS_URL}/collection`,
            collectionPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': HIPPOCAMPUS_API_KEY
                },
                timeout: 30000 // 30 seconds timeout
            }
        );
        
        if (!response.data || !response.data._id) {
            throw new Error('No collection ID returned from Hippocampus API');
        }
        
        const collectionId = response.data._id;
        console.log(`  ✓ Collection created via API with ID: ${collectionId}`);
        
        // Save collection to MongoDB
        const newCollection = {
            collection_id: collectionId,
            name: response.data.name || 'high_accuracy',
            org_id: orgId,
            resource_ids: [],
            settings: response.data.settings || highAccuracyConfig.settings,
            created_at: response.data.createdAt ? new Date(response.data.createdAt) : new Date(),
            updated_at: response.data.updatedAt ? new Date(response.data.updatedAt) : new Date()
        };
        
        await ragCollections.insertOne(newCollection);
        console.log(`  ✓ Collection saved to MongoDB: ${collectionId}`);
        
        return collectionId;
    } catch (error) {
        console.error(`  ✗ Error ensuring collection exists for org ${orgId}:`, error.message);
        if (error.response) {
            console.error(`  ✗ API Response:`, error.response.data);
        }
        retryLog.collectionCreationErrors.push({
            org_id: orgId,
            error: error.message,
            api_response: error.response?.data
        });
        throw error;
    }
}

/**
 * Check if resource exists in any collection
 */
async function checkResourceExists(db, resourceId) {
    try {
        const ragCollections = db.collection("rag_collections");
        
        // Check if this resource ID exists in any collection's resource_ids array
        const existingCollection = await ragCollections.findOne({
            resource_ids: resourceId
        });
        
        if (existingCollection) {
            console.log(`  ✓ Resource ${resourceId} already exists in collection ${existingCollection.collection_id}`);
            return {
                exists: true,
                collectionId: existingCollection.collection_id
            };
        }
        
        return { exists: false };
    } catch (error) {
        console.error(`  ✗ Error checking if resource exists:`, error.message);
        throw error;
    }
}

/**
 * Create resource in Hippocampus with existing ID
 */
async function createResourceWithExistingId(collectionId, docData, ownerId) {
    try {
        const chunkingStrategy = normalizeChunkingType(docData.chunking_type);
        
        // Prepare settings with chunking configuration
        const settings = {
            chunkSize: docData.chunk_size || 1000,
            chunkOverlap: docData.chunk_overlap || 100,
            strategy: chunkingStrategy
        };
        
        // Prepare resource data with existing _id
        const resourcePayload = {
            _id: docData._id.toString(), // Use the existing document _id
            collectionId,
            title: docData.name || 'Untitled Resource',
            description: docData.description || '',
            ownerId: ownerId || 'public',
            settings
        };
        
        // Priority 1: Use content if present
        if (docData.content !== undefined && docData.content !== null && docData.content !== '') {
            // Always convert content to string
            if (typeof docData.content === 'string') {
                resourcePayload.content = docData.content;
            } else if (typeof docData.content === 'object') {
                // If content is an object, stringify it
                resourcePayload.content = JSON.stringify(docData.content);
            } else {
                // For any other type, convert to string
                resourcePayload.content = String(docData.content);
            }
            console.log(`  → Using content from document (content length: ${resourcePayload.content.length}, original type: ${typeof docData.content})`);
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
        // Update in configuration_versions-rag collection
        const bridgeVersions = db.collection("configuration_versions-rag");
        const bridgeDocsToUpdate = await bridgeVersions.find({
            doc_ids: oldDocId
        }).toArray();
        
        console.log(`  → Found ${bridgeDocsToUpdate.length} configuration_versions to update`);
        
        for (const bridgeDoc of bridgeDocsToUpdate) {
            try {
                // Find the old doc_id in the array and replace with new structure
                const newDocIds = (bridgeDoc.doc_ids || []).map(docId => {
                    const docIdStr = docId.toString ? docId.toString() : String(docId);
                    const oldDocIdStr = oldDocId.toString ? oldDocId.toString() : String(oldDocId);
                    
                    if (docIdStr === oldDocIdStr) {
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
                    // Keep other string IDs as they are (might be migrated later)
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
                
                console.log(`    ✓ Updated configuration_version ${bridgeDoc._id}`);
            } catch (error) {
                console.error(`    ✗ Error updating configuration_version ${bridgeDoc._id}:`, error.message);
                updateErrors.push({
                    collection: 'configuration_versions-rag',
                    document_id: bridgeDoc._id,
                    error: error.message
                });
            }
        }
        
        // Update in configurations-rag collection
        const configurations = db.collection("configurations-rag");
        const configDocsToUpdate = await configurations.find({
            doc_ids: oldDocId
        }).toArray();
        
        console.log(`  → Found ${configDocsToUpdate.length} configurations to update`);
        
        for (const configDoc of configDocsToUpdate) {
            try {
                // Find the old doc_id in the array and replace with new structure
                const newDocIds = (configDoc.doc_ids || []).map(docId => {
                    const docIdStr = docId.toString ? docId.toString() : String(docId);
                    const oldDocIdStr = oldDocId.toString ? oldDocId.toString() : String(oldDocId);
                    
                    if (docIdStr === oldDocIdStr) {
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
                    // Keep other string IDs as they are
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
                    collection: 'configurations-rag',
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
 * Main retry migration function
 */
async function retryFailedMigration() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✓ Connected to MongoDB');
        console.log('🔄 Starting retry migration for failed documents...\n');
        
        const db = client.db("AI_Middleware-test");
        const ragParentDatas = db.collection("rag_parent_datas");
        
        // Load missing IDs from JSON file
        console.log('📖 Loading missing IDs from missing_ids.json...');
        const missingIdsData = JSON.parse(fs.readFileSync('./missing_ids.json', 'utf-8'));
        const missingIds = Object.keys(missingIdsData);
        
        console.log(`📊 Total documents to retry: ${missingIds.length}\n`);
        
        // Process each missing ID
        for (let i = 0; i < missingIds.length; i++) {
            const docId = missingIds[i];
            retryLog.totalProcessed++;
            
            console.log(`\n${'='.repeat(80)}`);
            console.log(`Processing Document [${retryLog.totalProcessed}/${missingIds.length}]: ${docId}`);
            console.log(`${'='.repeat(80)}`);
            
            try {
                // Fetch document from database
                let doc;
                try {
                    doc = await ragParentDatas.findOne({ _id: new ObjectId(docId) });
                } catch (objectIdError) {
                    // If ObjectId conversion fails, try as string
                    doc = await ragParentDatas.findOne({ _id: docId });
                }
                
                if (!doc) {
                    console.log(`  ⚠️  Document not found in database, skipping...`);
                    retryLog.skipped.push({
                        doc_id: docId,
                        reason: 'Document not found in database'
                    });
                    continue;
                }
                
                console.log(`  ✓ Found document in database`);
                console.log(`  Name: ${doc.name || 'N/A'}`);
                console.log(`  Org ID: ${doc.org_id}`);
                console.log(`  Chunking Type: ${doc.chunking_type}`);
                
                // Step 1: Ensure collection exists for org
                console.log(`\nStep 1: Ensuring high_accuracy collection exists for org ${doc.org_id}...`);
                const collectionId = await ensureCollectionExists(db, doc.org_id);
                
                // Step 2: Check if resource already exists in any collection
                console.log(`\nStep 2: Checking if resource already exists...`);
                const resourceCheck = await checkResourceExists(db, doc._id.toString());
                
                let resourceId = doc._id.toString();
                
                if (resourceCheck.exists) {
                    console.log(`  ✓ Resource already exists in collection ${resourceCheck.collectionId}`);
                    retryLog.resourceAlreadyExists++;
                    
                    // Use the existing collection ID
                    const existingCollectionId = resourceCheck.collectionId;
                    
                    // Step 3: Update agent doc_ids (configurations and configuration_versions)
                    console.log(`\nStep 3: Updating configurations and configuration_versions...`);
                    const updateErrors = await updateAgentDocIds(
                        db,
                        doc._id.toString(),
                        existingCollectionId,
                        resourceId,
                        doc.description
                    );
                    
                    if (updateErrors.length > 0) {
                        retryLog.agentUpdateErrors.push({
                            doc_id: doc._id.toString(),
                            errors: updateErrors
                        });
                    }
                    
                } else {
                    console.log(`  → Resource does not exist, creating new resource...`);
                    
                    // Step 3: Determine ownerId
                    let ownerId;
                    const userIdStr = doc.user_id ? doc.user_id.toString() : null;
                    
                    if (doc.folder_id && doc.user_id) {
                        ownerId = `${doc.org_id}_${doc.folder_id}_${doc.user_id}`;
                    } else if (doc.user_id && userIdStr && SPECIFIC_USER_IDS[userIdStr] && !doc.folder_id) {
                        // If user_id is in the specific map AND there's no folder_id
                        console.log(`  → Found user ${userIdStr} in SPECIFIC_USER_IDS map, creating/getting rag_folder...`);
                        const ragFolderId = await ensureRagFolderExists(db, doc.org_id, doc.user_id);
                        ownerId = `${doc.org_id}_${ragFolderId}_${doc.user_id}`;
                        console.log(`  → Using org_id + rag_folder_id + user_id: ${ownerId}`);
                    } else {
                        ownerId = doc.org_id;
                    }
                    
                    // Step 4: Create resource in Hippocampus with existing ID
                    console.log(`\nStep 4: Creating resource in Hippocampus with ID ${resourceId}...`);
                    resourceId = await createResourceWithExistingId(collectionId, doc, ownerId);
                    console.log(`  ✓ Resource created: ${resourceId}`);
                    retryLog.resourceCreated++;
                    
                    // Step 5: Add resource to collection
                    console.log(`\nStep 5: Adding resource to collection...`);
                    await addResourceToCollection(db, collectionId, resourceId);
                    
                    // Step 6: Update agent doc_ids
                    console.log(`\nStep 6: Updating configurations and configuration_versions...`);
                    const updateErrors = await updateAgentDocIds(
                        db,
                        doc._id.toString(),
                        collectionId,
                        resourceId,
                        doc.description
                    );
                    
                    if (updateErrors.length > 0) {
                        retryLog.agentUpdateErrors.push({
                            doc_id: doc._id.toString(),
                            errors: updateErrors
                        });
                    }
                }
                
                retryLog.successful++;
                console.log(`\n✓ Successfully processed document ${doc._id}`);
                console.log(`📈 Progress: ${retryLog.successful}/${retryLog.totalProcessed} successful (${Math.round((retryLog.successful / retryLog.totalProcessed) * 100)}%)`);
                
                // Save progress every 10 successful migrations
                if (retryLog.successful % 10 === 0) {
                    const progressLogPath = './recover_migration_progress.json';
                    fs.writeFileSync(progressLogPath, JSON.stringify({
                        ...retryLog,
                        lastUpdated: new Date().toISOString(),
                        progress: `${retryLog.totalProcessed}/${missingIds.length}`
                    }, null, 2));
                    console.log(`💾 Progress saved to ${progressLogPath}`);
                }
                
            } catch (error) {
                console.error(`\n✗ Failed to process document ${docId}:`, error.message);
                retryLog.failed.push({
                    doc_id: docId,
                    error: error.message,
                    stack: error.stack
                });
                
                // Continue with next document
                continue;
            }
        }
        
        // Print final summary
        console.log('\n\n' + '='.repeat(80));
        console.log('RETRY MIGRATION SUMMARY');
        console.log('='.repeat(80));
        console.log(`Total Documents Processed: ${retryLog.totalProcessed}`);
        console.log(`Successfully Migrated: ${retryLog.successful}`);
        console.log(`Failed: ${retryLog.failed.length}`);
        console.log(`Skipped: ${retryLog.skipped.length}`);
        console.log(`Resources Already Existed: ${retryLog.resourceAlreadyExists}`);
        console.log(`Resources Created: ${retryLog.resourceCreated}`);
        console.log(`Collection Creation Errors: ${retryLog.collectionCreationErrors.length}`);
        console.log(`Resource Creation Errors: ${retryLog.resourceCreationErrors.length}`);
        console.log(`Agent Update Errors: ${retryLog.agentUpdateErrors.length}`);
        console.log('='.repeat(80));
        
        // Print detailed logs
        if (retryLog.failed.length > 0) {
            console.log('\n\nFAILED DOCUMENTS:');
            console.log('='.repeat(80));
            retryLog.failed.forEach((failure, index) => {
                console.log(`\n${index + 1}. Document ID: ${failure.doc_id}`);
                console.log(`   Error: ${failure.error}`);
            });
        }
        
        if (retryLog.skipped.length > 0) {
            console.log('\n\nSKIPPED DOCUMENTS:');
            console.log('='.repeat(80));
            retryLog.skipped.forEach((skipped, index) => {
                console.log(`\n${index + 1}. Document ID: ${skipped.doc_id}`);
                console.log(`   Reason: ${skipped.reason}`);
            });
        }
        
        if (retryLog.agentUpdateErrors.length > 0) {
            console.log('\n\nAGENT UPDATE ERRORS:');
            console.log('='.repeat(80));
            retryLog.agentUpdateErrors.forEach((error, index) => {
                console.log(`\n${index + 1}. Document ID: ${error.doc_id}`);
                console.log(`   Errors: ${JSON.stringify(error.errors, null, 2)}`);
            });
        }
        
        // Save final log to file
        const finalLogPath = './recover_migration_final.json';
        fs.writeFileSync(finalLogPath, JSON.stringify(retryLog, null, 2));
        console.log(`\n\n✓ Final migration log saved to: ${finalLogPath}`);
        
    } catch (error) {
        console.error('\n\nCRITICAL ERROR:', error);
        
        // Save progress even on failure
        const errorLogPath = './recover_migration_errors.json';
        fs.writeFileSync(errorLogPath, JSON.stringify({
            ...retryLog,
            criticalError: error.message,
            errorStack: error.stack,
            lastUpdated: new Date().toISOString()
        }, null, 2));
        console.log(`\n💾 Progress and errors saved to: ${errorLogPath}`);
        
        throw error;
    } finally {
        await client.close();
        console.log('\n\nMongoDB connection closed');
    }
}

// Run the retry migration
retryFailedMigration()
    .then(() => {
        console.log('\n✓ Retry migration completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ Retry migration failed:', error);
        process.exit(1);
    });
