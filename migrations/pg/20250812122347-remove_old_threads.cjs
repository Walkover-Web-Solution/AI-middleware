'use strict';
const { MongoClient } = require('mongodb');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Migration to clean up orphaned MongoDB threads
     * by removing threads that don't have corresponding data in PostgreSQL conversations table
     * 
     * This migration:
     * 1. Fetches all threads from MongoDB 'threads' collection
     * 2. For each thread, checks if corresponding data exists in PostgreSQL 'conversations' table
     * 3. Uses org_id, bridge_id, thread_id, sub_thread_id to match records
     * 4. Deletes MongoDB threads that don't have matching PostgreSQL records
     */
    
    // MongoDB connection string - use environment variables
    const mongoUrl = process.env.MONGODB_CONNECTION_URI;
    const mongoClient = new MongoClient(mongoUrl);
    
    try {
      console.log('Starting migration: Remove orphaned threads from MongoDB...');
      
      // Connect to MongoDB
      await mongoClient.connect();
      console.log('Connected to MongoDB successfully');
      
      const dbName = process.env.MONGODB_DATABASE_NAME;
      const db = mongoClient.db(dbName);
      const threadsCollection = db.collection("threads");
      
      // Fetch all threads from MongoDB
      const allThreads = await threadsCollection.find({}).toArray();
      console.log(`Found ${allThreads.length} threads in MongoDB to process`);
      
      if (allThreads.length === 0) {
        console.log('No threads found in MongoDB. Migration completed.');
        return;
      }
      
      // Process each thread
      let deletedCount = 0;
      let keptCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const thread of allThreads) {
        try {
          const { _id, org_id, bridge_id, thread_id, sub_thread_id } = thread;
          
          // Skip threads with missing required fields
          if (!org_id || !thread_id) {
            console.log(`Skipping thread with missing org_id or thread_id: ${_id}`);
            skippedCount++;
            continue;
          }
          
          // Build the query conditions for PostgreSQL
          let whereCondition = { 
            org_id, 
            thread_id
          };
          
          // Add bridge_id to condition if it exists
          if (bridge_id) {
            whereCondition.bridge_id = bridge_id;
          }
          
          // Add sub_thread_id to condition if it exists
          if (sub_thread_id) {
            whereCondition.sub_thread_id = sub_thread_id;
          }
          
          // Build dynamic SQL query based on available fields
          let sqlQuery = `SELECT COUNT(*) as count FROM conversations WHERE org_id = :org_id AND thread_id = :thread_id`;
          
          if (bridge_id) {
            sqlQuery += ` AND bridge_id = :bridge_id`;
          }
          
          if (sub_thread_id) {
            sqlQuery += ` AND sub_thread_id = :sub_thread_id`;
          }
          
          // Check if corresponding record exists in PostgreSQL conversations table
          const pgResult = await queryInterface.sequelize.query(
            sqlQuery,
            {
              replacements: whereCondition,
              type: Sequelize.QueryTypes.SELECT
            }
          );
          
          const recordExists = pgResult[0].count > 0;
          
          if (recordExists) {
            // Record exists in PostgreSQL, keep the MongoDB thread
            console.log(`Keeping thread ${thread_id} (org: ${org_id}${bridge_id ? `, bridge: ${bridge_id}` : ''}${sub_thread_id ? `, sub: ${sub_thread_id}` : ''}) - found in PostgreSQL`);
            keptCount++;
          } else {
            // Record doesn't exist in PostgreSQL, delete from MongoDB
            await threadsCollection.deleteOne({ _id: _id });
            console.log(`Deleted thread ${thread_id} (org: ${org_id}${bridge_id ? `, bridge: ${bridge_id}` : ''}${sub_thread_id ? `, sub: ${sub_thread_id}` : ''}) - not found in PostgreSQL`);
            deletedCount++;
          }
          
        } catch (threadError) {
          console.error(`Error processing thread ${thread._id}:`, threadError);
          errorCount++;
        }
      }
      
      console.log(`Migration completed. Deleted: ${deletedCount}, Kept: ${keptCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
      
    } catch (error) {
      console.error('Error during migration:', error);
      throw error; // Rethrow to fail the migration
    } finally {
      await mongoClient.close();
      console.log('MongoDB connection closed');
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * This migration deletes MongoDB documents and cannot be easily reverted.
     * If needed, a backup should be created before running this migration.
     */
    console.log('Down migration not implemented - deleted MongoDB threads cannot be restored without backup.');
  }
};
