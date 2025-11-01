'use strict';

const { MongoClient, ObjectId } = require('mongodb');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority');
    
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
      
      // Step 3: Get all MongoDB documents
      const allBridges = await configurations.find({}, { projection: { _id: 1 } }).toArray();
      const allVersions = await configurationVersions.find({}, { projection: { _id: 1 } }).toArray();
      
      console.log(`Found ${allBridges.length} bridges and ${allVersions.length} versions in MongoDB`);
      
      // Step 4: Identify unused bridges and versions
      const bridgesToDelete = [];
      const versionsToDelete = [];
      
      // Check bridges
      for (const bridge of allBridges) {
        const bridgeId = bridge._id.toString();
        if (!usedBridgeIds.has(bridgeId)) {
          bridgesToDelete.push(bridge._id);
        }
      }
      
      // Check versions - only delete if:
      // 1. The version_id is not used in conversations, AND
      // 2. The parent bridge (hello_id) is also being deleted OR doesn't exist
      for (const version of allVersions) {
        const versionId = version._id.toString();
        const parentBridgeId = version.hello_id;
        
        if (!usedVersionIds.has(versionId)) {
          // Check if parent bridge exists and is being used
          const parentBridgeUsed = parentBridgeId && usedBridgeIds.has(parentBridgeId);
          
          if (!parentBridgeUsed) {
            // Safe to delete this version
          versionsToDelete.push(version._id);
          } else {
            console.log(`Skipping version ${versionId} because parent bridge ${parentBridgeId} is still in use`);
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
