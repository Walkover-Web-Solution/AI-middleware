/* eslint-disable no-unused-vars */
"use strict";
const { MongoClient } = require("mongodb");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Migration to update MongoDB threads with missing bridge_ids
     * by fetching the corresponding bridge_ids from PostgreSQL conversations table
     *
     * This migration ensures that:
     * 1. Only MongoDB threads without bridge_id are updated
     * 2. thread_id, org_id, and sub_thread_id are used to find matching bridge_ids in PostgreSQL
     * 3. Edge case handling for multiple bridge_ids with same identifiers
     * 4. Proper error handling and logging is implemented
     */

    // MongoDB connection string - use environment variables in production
    const mongoUrl = process.env.MONGODB_CONNECTION_URI;
    const mongoClient = new MongoClient(mongoUrl);

    try {
      console.log("Starting migration: Update missing bridge_ids in MongoDB threads...");

      // Connect to MongoDB
      await mongoClient.connect();
      console.log("Connected to MongoDB successfully");

      const dbName = process.env.MONGODB_DATABASE_NAME;
      const db = mongoClient.db(dbName);
      const threadsCollection = db.collection("threads");

      // Find all threads in MongoDB where bridge_id is not present
      const threadsWithoutBridgeId = await threadsCollection
        .find({
          $or: [{ bridge_id: { $exists: false } }, { bridge_id: null }, { bridge_id: "" }],
        })
        .toArray();

      console.log(`Found ${threadsWithoutBridgeId.length} threads without bridge_id in MongoDB`);

      if (threadsWithoutBridgeId.length === 0) {
        console.log("No threads found without bridge_id. Migration completed.");
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

          // Build the query conditions for PostgreSQL using Sequelize
          let whereCondition = {
            org_id,
            thread_id,
          };

          // Add sub_thread_id to condition if it exists
          if (sub_thread_id) {
            whereCondition.sub_thread_id = sub_thread_id;
          }

          // Find all corresponding bridge_ids in PostgreSQL 'conversations' table using Sequelize
          const pgConversations = await queryInterface.sequelize.query(
            `SELECT bridge_id, org_id, thread_id, sub_thread_id 
             FROM conversations 
             WHERE org_id = :org_id 
               AND thread_id = :thread_id 
               ${sub_thread_id ? "AND sub_thread_id = :sub_thread_id" : ""} 
             GROUP BY bridge_id, org_id, thread_id, sub_thread_id`,
            {
              replacements: whereCondition,
              type: Sequelize.QueryTypes.SELECT,
            }
          );

          // PostgreSQL may return multiple rows with different bridge_ids
          if (pgConversations.length === 0) {
            console.log(
              `No bridge_id found in PostgreSQL for thread ${thread_id}, org_id ${org_id}${sub_thread_id ? `, sub_thread_id ${sub_thread_id}` : ""}`
            );
            skippedCount++;
            continue;
          }

          console.log(`Found ${pgConversations.length} bridge_id(s) for thread ${thread_id}`);

          // Process the bridge_ids found in PostgreSQL
          for (let i = 0; i < pgConversations.length; i++) {
            const pgRecord = pgConversations[i];
            const bridgeIdFromPg = pgRecord.bridge_id;

            if (!bridgeIdFromPg) {
              console.log(`Skipping record with null/empty bridge_id for thread ${thread_id}`);
              continue;
            }

            // For the first bridge_id, update the existing thread
            if (i === 0) {
              await threadsCollection.updateOne({ _id: thread._id }, { $set: { bridge_id: bridgeIdFromPg } });
              console.log(`Updated thread ${thread_id} with bridge_id: ${bridgeIdFromPg}`);
              updatedCount++;
            } else {
              // For additional bridge_ids, create new documents with the same values but different bridge_id
              const { _id, ...threadClone } = thread;

              // Clone the entire document and only change the bridge_id
              const newThreadDoc = {
                ...threadClone,
                bridge_id: bridgeIdFromPg,
              };
              await threadsCollection.insertOne(newThreadDoc);
              console.log(`Created new thread document for additional bridge_id: ${bridgeIdFromPg}`);
              updatedCount++;
            }
          }
        } catch (threadError) {
          console.error(`Error processing thread ${thread._id}:`, threadError);
          errorCount++;
        }
      }

      console.log(`Migration completed. Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    } catch (error) {
      console.error("Error during migration:", error);
      throw error; // Rethrow to fail the migration
    } finally {
      await mongoClient.close();
      console.log("MongoDB connection closed");
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * This migration updates MongoDB documents and cannot be easily reverted.
     * If needed, a separate backup/restore strategy should be implemented.
     */
    console.log("Down migration not implemented for this migration as it modifies MongoDB data.");
  },
};
