'use strict';

const mongoose = require('mongoose');
require('dotenv').config();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
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
      
      // Step 2: Connect to MongoDB using Mongoose
      mongoose.set('strictQuery', false);
      await mongoose.connect(process.env.MONGODB_CONNECTION_URI);
      console.log('Connected to MongoDB using Mongoose');
      
      // Step 3: Import Mongoose models
      const configurationModel = (await import('../../src/mongoModel/configuration.js')).default;
      const versionModel = (await import('../../src/mongoModel/bridge_version.js')).default;
      
      // Step 4: Get all MongoDB documents (including status field for bridges, parent_id and status for versions)
      // Only get bridges with status 1
      const allBridges = await configurationModel.find({ status: 1 }, { _id: 1, status: 1 }).lean();
      
      // Get parent bridge IDs with status 1
      const parentBridgeIdsWithStatus1 = allBridges.map(bridge => bridge._id);
      
      // Only get versions whose parent bridge has status 1
      const allVersions = await versionModel.find(
        { parent_id: { $in: parentBridgeIdsWithStatus1 } },
        { _id: 1, parent_id: 1, status: 1 }
      ).lean();
      
      console.log(`Found ${allBridges.length} bridges and ${allVersions.length} versions in MongoDB`);
      
      // Step 5: Identify unused bridges and versions, and unarchive archived ones with history
      const bridgesToDelete = [];
      const versionsToDelete = [];
      const bridgesToUnarchive = [];
      const bridgeIdsToDelete = new Set(); // Track bridge IDs being deleted
      
      // Check bridges - only delete if status is 0 and not used in conversations
      // Also unarchive bridges that have history but are archived (status !== 0)
      for (const bridge of allBridges) {
        const bridgeId = bridge._id.toString();
        const hasStatusZero = bridge.status === 0;
        const hasHistory = usedBridgeIds.has(bridgeId);
        
        if (!hasHistory && hasStatusZero) {
          // Unused and archived - safe to delete
          bridgesToDelete.push(bridge._id);
          bridgeIdsToDelete.add(bridgeId);
        } else if (hasHistory && !hasStatusZero) {
          // Has history but is archived - unarchive it
          bridgesToUnarchive.push(bridge._id);
          console.log(`Will unarchive bridge ${bridgeId} (has history but status is ${bridge.status})`);
        } else if (!hasHistory && !hasStatusZero) {
          console.log(`Skipping bridge ${bridgeId} because status is ${bridge.status} (not 0)`);
        }
      }
      
      // Check versions - only delete if:
      // 1. The version_id is not used in conversations, AND
      // 2. The parent bridge (parent_id) is being deleted (has status 0 and is unused)
      // If version has history, unarchive its parent bridge (not the version itself)
      for (const version of allVersions) {
        const versionId = version._id.toString();
        const parentBridgeId = version.parent_id ? version.parent_id.toString() : null;
        const hasHistory = usedVersionIds.has(versionId);
        
        if (hasHistory && parentBridgeId) {
          // Version has history - unarchive its parent bridge instead of the version
          // Add parent bridge ID to bridgesToUnarchive (convert string to ObjectId)
          bridgesToUnarchive.push(new mongoose.Types.ObjectId(parentBridgeId));
          console.log(`Will unarchive parent bridge ${parentBridgeId} (version ${versionId} has history)`);
        } else if (!hasHistory) {
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
      console.log(`Identified ${bridgesToUnarchive.length} bridges for unarchiving (based on bridge and version history)`);
      
      // Step 6: Unarchive bridges that have history but are archived
      // bridgesToUnarchive contains both bridges with history and parent bridges of versions with history
      let unarchivedBridges = 0;
      
      if (bridgesToUnarchive.length > 0) {
        const bridgeUnarchiveResult = await configurationModel.updateMany(
          { _id: { $in: bridgesToUnarchive } },
          { $set: { status: 0 } }
        );
        unarchivedBridges = bridgeUnarchiveResult.modifiedCount;
        console.log(`Unarchived ${unarchivedBridges} bridges (set status to 0)`);
      }
      
      // Step 7: Delete unused documents
      let deletedBridges = 0;
      let deletedVersions = 0;
      
      if (bridgesToDelete.length > 0) {
        const bridgeDeleteResult = await configurationModel.deleteMany({
          _id: { $in: bridgesToDelete }
        });
        deletedBridges = bridgeDeleteResult.deletedCount;
        console.log(`Deleted ${deletedBridges} unused bridges`);
      }
      
      if (versionsToDelete.length > 0) {
        const versionDeleteResult = await versionModel.deleteMany({
          _id: { $in: versionsToDelete }
        });
        deletedVersions = versionDeleteResult.deletedCount;
        console.log(`Deleted ${deletedVersions} unused versions`);
      }
      
      await transaction.commit();
      
      console.log('Migration completed successfully!');
      console.log(`Summary: Deleted ${deletedBridges} bridges and ${deletedVersions} versions`);
      console.log(`Summary: Unarchived ${unarchivedBridges} bridges (based on bridge and version history)`);
      
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
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
