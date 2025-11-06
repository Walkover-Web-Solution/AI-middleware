'use strict';

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const client = new MongoClient(process.env.MONGODB_CONNECTION_URI);
    
    try {
      console.log('Starting cleanup of unused MongoDB bridges and versions...');
      
      // Step 1: Get all bridge_ids and version_ids from PostgreSQL conversations table
      const [bridgeResults] = await queryInterface.sequelize.query(
        'SELECT DISTINCT bridge_id FROM conversations WHERE bridge_id IS NOT NULL',
        { transaction }
      );
      
      const [versionResults] = await queryInterface.sequelize.query(
        'SELECT DISTINCT version_id FROM conversations WHERE version_id IS NOT NULL',
        { transaction }
      );
      
      const usedBridgeIds = new Set(bridgeResults.map(row => row.bridge_id));
      const usedVersionIds = new Set(versionResults.map(row => row.version_id));
      
      console.log(`Found ${usedBridgeIds.size} unique bridge_ids and ${usedVersionIds.size} unique version_ids in conversations table`);
      
      // Step 2: Connect to MongoDB
      await client.connect();
      const db = client.db("AI_Middleware-test");
      const configurations = db.collection("configurations");
      const configurationVersions = db.collection("configuration_version");
      
      // Step 3: Get all MongoDB documents (including status field for bridges, parent_id for versions)
      const allBridges = await configurations.find({}, { projection: { _id: 1, status: 1 } }).toArray();
      const allVersions = await configurationVersions.find({}, { projection: { _id: 1, parent_id: 1 } }).toArray();
      
      console.log(`Found ${allBridges.length} bridges and ${allVersions.length} versions in MongoDB`);
      
      // Step 4: Identify unused bridges and versions
      const bridgesToDelete = [];
      const versionsToDelete = [];
      const bridgeIdsToDelete = new Set(); // Track bridge IDs being deleted
      
      // Check bridges - only delete if status is 0 and not used in conversations
      for (const bridge of allBridges) {
        const bridgeId = bridge._id.toString();
        const hasStatusZero = bridge.status === 0;
        
        if (!usedBridgeIds.has(bridgeId) && hasStatusZero) {
          bridgesToDelete.push(bridge._id);
          bridgeIdsToDelete.add(bridgeId);
        } else if (!usedBridgeIds.has(bridgeId) && !hasStatusZero) {
          console.log(`Skipping bridge ${bridgeId} because status is ${bridge.status} (not 0)`);
        }
      }
      
      // Check versions - only delete if:
      // 1. The version_id is not used in conversations, AND
      // 2. The parent bridge (parent_id) is being deleted (has status 0 and is unused)
      for (const version of allVersions) {
        const versionId = version._id.toString();
        const parentBridgeId = version.parent_id ? version.parent_id.toString() : null;
        
        if (!usedVersionIds.has(versionId)) {
          // Check if parent bridge is being deleted
          const parentBridgeBeingDeleted = parentBridgeId && bridgeIdsToDelete.has(parentBridgeId);
          
          if (parentBridgeBeingDeleted) {
            // Safe to delete this version since parent bridge is being deleted
            versionsToDelete.push(version._id);
          } else if (!parentBridgeId) {
            // No parent bridge reference, safe to delete
            versionsToDelete.push(version._id);
          } else {
            console.log(`Skipping version ${versionId} because parent bridge ${parentBridgeId} is not being deleted (either in use or status != 0)`);
          }
        }
      }
      
      console.log(`Identified ${bridgesToDelete.length} bridges and ${versionsToDelete.length} versions for deletion`);
      
      // Step 5: Delete unused documents
      let deletedBridges = 0;
      let deletedVersions = 0;
      
      if (bridgesToDelete.length > 0) {
        const bridgeDeleteResult = await configurations.deleteMany({
          _id: { $in: bridgesToDelete }
        });
        deletedBridges = bridgeDeleteResult.deletedCount;
        console.log(`Deleted ${deletedBridges} unused bridges`);
      }
      
      if (versionsToDelete.length > 0) {
        const versionDeleteResult = await configurationVersions.deleteMany({
          _id: { $in: versionsToDelete }
        });
        deletedVersions = versionDeleteResult.deletedCount;
        console.log(`Deleted ${deletedVersions} unused versions`);
      }
      
      await transaction.commit();
      
      console.log('Migration completed successfully!');
      console.log(`Summary: Deleted ${deletedBridges} bridges and ${deletedVersions} versions`);
      
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await client.close();
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * This migration performs irreversible deletions.
     * To rollback, you would need to restore from a backup.
     * 
     * Consider creating a backup before running this migration:
     * mongodump --db your_database_name --collection configurations
     * mongodump --db your_database_name --collection configuration_versions
     */
    console.log('This migration cannot be automatically rolled back.');
    console.log('Please restore from a MongoDB backup if you need to revert these changes.');
  }
};
