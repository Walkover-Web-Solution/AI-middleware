import { MongoClient } from 'mongodb';
import models from '../models/index.js';
import crypto from 'crypto';

/**
 * Migration script to update MongoDB threads with missing bridge_ids
 * by fetching the corresponding bridge_ids from PostgreSQL conversations table
 * 
 * This script ensures that:
 * 1. Only MongoDB threads without bridge_id are updated
 * 2. Both thread_id and org_id are validated to ensure correct matching
 * 3. Proper error handling and logging is implemented
 */
async function updateMissingBridgeIds() {
    const mongoUrl = 'mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware-test';
    const mongoClient = new MongoClient(mongoUrl);
    
    try {
        console.log('Starting migration: Update missing bridge_ids in MongoDB threads...');
        
        // Connect to MongoDB
        await mongoClient.connect();
        console.log('Connected to MongoDB successfully');
        
        const db = mongoClient.db("AI_Middleware-test");
        const threadsCollection = db.collection("threads");
        
        // Find all threads in MongoDB where bridge_id is not present
        const threadsWithoutBridgeId = await threadsCollection.find({
            $or: [
                { bridge_id: { $exists: false } },
                { bridge_id: null },
                { bridge_id: "" }
            ]
        }).toArray();
        
        console.log(`Found ${threadsWithoutBridgeId.length} threads without bridge_id in MongoDB`);
        
        if (threadsWithoutBridgeId.length === 0) {
            console.log('No threads found without bridge_id. Migration completed.');
            return;
        }
        
        // Process each thread
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const thread of threadsWithoutBridgeId) {
            try {
                const { thread_id, org_id, sub_thread_id } = thread;
                
                if (!thread_id || !org_id) {
                    console.log(`Skipping thread with missing thread_id or org_id: ${thread._id}`);
                    skippedCount++;
                    continue;
                }
                
                // Build the query conditions
                let whereCondition = { org_id };
                
                // If sub_thread_id exists, use it for more precise matching
                if (sub_thread_id) {
                    whereCondition.sub_thread_id = sub_thread_id;
                    console.log(`Using sub_thread_id ${sub_thread_id} for matching`);
                } else {
                    whereCondition.thread_id = thread_id;
                    console.log(`Using thread_id ${thread_id} for matching (no sub_thread_id available)`);
                }
                
                // Find corresponding bridge_id in PostgreSQL with org_id and sub_thread_id/thread_id validation
                const pgConversations = await models.pg.conversations.findAll({
                    attributes: ['bridge_id', 'org_id', 'thread_id', 'sub_thread_id'],
                    where: whereCondition,
                    raw: true
                });
                
                // If no results with sub_thread_id, fall back to thread_id
                if (pgConversations.length === 0 && sub_thread_id) {
                    console.log(`No matches found with sub_thread_id ${sub_thread_id}, falling back to thread_id ${thread_id}`);
                    const fallbackConversations = await models.pg.conversations.findAll({
                        attributes: ['bridge_id', 'org_id', 'thread_id', 'sub_thread_id'],
                        where: {
                            thread_id,
                            org_id
                        },
                        raw: true
                    });
                    
                    if (fallbackConversations.length > 0) {
                        console.log(`Found ${fallbackConversations.length} matches using thread_id fallback`);
                        pgConversations.push(...fallbackConversations);
                    }
                }
                
                // Filter conversations by matching org_id
                const matchingConversations = pgConversations.filter(conv => conv.org_id === org_id);
                
                // Get unique bridge_ids
                const uniqueBridgeIds = [...new Set(matchingConversations.map(conv => conv.bridge_id))];
                
                if (uniqueBridgeIds.length === 1) {
                    // Case 1: Single bridge_id found - update the MongoDB document
                    const bridgeId = uniqueBridgeIds[0];
                    await threadsCollection.updateOne(
                        { _id: thread._id },
                        { $set: { bridge_id: bridgeId } }
                    );
                    
                    console.log(`Updated thread ${thread_id} with bridge_id: ${bridgeId} (org_id: ${org_id})`);
                    updatedCount++;
                    
                    // If this thread has a sub_thread_id but it's the same as thread_id, ensure it's properly set
                    if (sub_thread_id && sub_thread_id === thread_id) {
                        // Check if there are any other documents with this thread_id but different sub_thread_ids
                        const relatedThreads = await models.pg.conversations.findAll({
                            attributes: ['sub_thread_id', 'bridge_id'],
                            where: {
                                thread_id,
                                org_id,
                                bridge_id: bridgeId
                            },
                            group: ['sub_thread_id', 'bridge_id'],
                            raw: true
                        });
                        
                        const uniqueSubThreadIds = [...new Set(relatedThreads.map(t => t.sub_thread_id))];
                        
                        // If we found sub_thread_ids different from the thread_id, create entries for each
                        if (uniqueSubThreadIds.length > 1) {
                            console.log(`Found ${uniqueSubThreadIds.length} unique sub_thread_ids for thread ${thread_id}`);
                            
                            for (const subThreadId of uniqueSubThreadIds) {
                                if (subThreadId !== thread_id) {
                                    // Generate a random display name
                                    const randomId = crypto.randomBytes(4).toString('hex');
                                    const displayName = `thread_${randomId}`;
                                    
                                    const newThreadDoc = {
                                        bridge_id: bridgeId,
                                        org_id: org_id,
                                        thread_id: thread_id,
                                        display_name: displayName,
                                        sub_thread_id: subThreadId,
                                        created_at: new Date(),
                                        updated_at: new Date()
                                    };
                                    
                                    await threadsCollection.insertOne(newThreadDoc);
                                    console.log(`Created new thread entry for sub_thread_id: ${subThreadId}, bridge_id: ${bridgeId}`);
                                }
                            }
                        }
                    }
                } else if (uniqueBridgeIds.length > 1) {
                    // Case 2: Multiple bridge_ids found - create a new entry in MongoDB
                    console.log(`Found multiple bridge_ids (${uniqueBridgeIds.join(', ')}) for thread_id: ${thread_id}, org_id: ${org_id}`);
                    
                    // Generate a random display name
                    const randomId = crypto.randomBytes(8).toString('hex');
                    const displayName = `thread_${randomId}`;
                    
                    // Create a new document for each bridge_id
                    for (const bridgeId of uniqueBridgeIds) {
                        const newThreadDoc = {
                            bridge_id: bridgeId,
                            org_id: org_id,
                            thread_id: thread_id,
                            display_name: displayName,
                            sub_thread_id: sub_thread_id || thread_id, // Use sub_thread_id if available, otherwise thread_id
                            created_at: new Date(),
                            updated_at: new Date()
                        };
                        
                        await threadsCollection.insertOne(newThreadDoc);
                        console.log(`Created new thread entry for bridge_id: ${bridgeId}, thread_id: ${thread_id}, display_name: ${displayName}`);
                    }
                    
                    // Update the original document with the first bridge_id
                    await threadsCollection.updateOne(
                        { _id: thread._id },
                        { $set: { bridge_id: uniqueBridgeIds[0] } }
                    );
                    
                    console.log(`Updated original thread ${thread_id} with bridge_id: ${uniqueBridgeIds[0]} (org_id: ${org_id})`);
                    updatedCount++;
                } else if (pgConversations.length > 0) {
                    console.log(`Found thread_id ${thread_id} in PostgreSQL but org_id ${org_id} doesn't match. Available org_ids: ${pgConversations.map(c => c.org_id).join(', ')}`);
                    skippedCount++;
                } else {
                    console.log(`No matching conversation found in PostgreSQL for thread_id: ${thread_id}`);
                    skippedCount++;
                }
            } catch (threadError) {
                console.error(`Error processing thread ${thread._id}:`, threadError);
                errorCount++;
            }
        }
        
        console.log(`Migration completed. Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
        
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await mongoClient.close();
        console.log('MongoDB connection closed');
    }
}

// Execute the migration
updateMissingBridgeIds()
    .then(() => {
        console.log('Migration script execution completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
