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
      const apikeyModel = (await import('../../src/mongoModel/apiModel.js')).default;
      const apiCallModel = (await import('../../src/mongoModel/apiCall.js')).default;
      
      // Step 4: Get all MongoDB documents (including status field for bridges, parent_id and status for versions)
      // Only get bridges with status 1 - include connected_agents data
      const allBridges = await configurationModel.find({ status: 1 }, { _id: 1, status: 1, connected_agents: 1 }).lean();
      
      // Get parent bridge IDs with status 1
      const parentBridgeIdsWithStatus1 = allBridges.map(bridge => bridge._id);
      
      // Only get versions whose parent bridge has status 1 - include connected_agents data
      const allVersions = await versionModel.find(
        { parent_id: { $in: parentBridgeIdsWithStatus1 } },
        { _id: 1, parent_id: 1, status: 1, connected_agents: 1 }
      ).lean();
      
      console.log(`Found ${allBridges.length} bridges and ${allVersions.length} versions in MongoDB`);
      
      // Step 4.5: Build connected agents dependency map and find all connected bridge IDs recursively
      const bridgeMap = new Map();
      const versionMap = new Map();
      
      // Create maps for quick lookup
      allBridges.forEach(bridge => {
        bridgeMap.set(bridge._id.toString(), bridge);
      });
      
      allVersions.forEach(version => {
        versionMap.set(version._id.toString(), version);
      });
      
      // Recursive function to find all connected agents (handles nested dependencies)
      function findAllConnectedAgents(bridgeId, visited = new Set()) {
        if (visited.has(bridgeId)) {
          return new Set(); // Avoid infinite loops
        }
        visited.add(bridgeId);
        
        const connectedAgentIds = new Set();
        
        // Check bridge connected_agents
        const bridge = bridgeMap.get(bridgeId);
        if (bridge && bridge.connected_agents) {
          Object.values(bridge.connected_agents).forEach(agent => {
            if (agent && agent.bridge_id) {
              const connectedBridgeId = agent.bridge_id.toString();
              connectedAgentIds.add(connectedBridgeId);
              
              // Recursively find connected agents of this connected agent
              const nestedConnected = findAllConnectedAgents(connectedBridgeId, new Set(visited));
              nestedConnected.forEach(id => connectedAgentIds.add(id));
            }
          });
        }
        
        // Check versions connected_agents for this bridge
        const bridgeVersions = allVersions.filter(v => v.parent_id && v.parent_id.toString() === bridgeId);
        bridgeVersions.forEach(version => {
          if (version.connected_agents) {
            Object.values(version.connected_agents).forEach(agent => {
              if (agent && agent.bridge_id) {
                const connectedBridgeId = agent.bridge_id.toString();
                connectedAgentIds.add(connectedBridgeId);
                
                // Recursively find connected agents of this connected agent
                const nestedConnected = findAllConnectedAgents(connectedBridgeId, new Set(visited));
                nestedConnected.forEach(id => connectedAgentIds.add(id));
              }
            });
          }
        });
        
        return connectedAgentIds;
      }
      
      // Find all bridges that have history (used in conversations or versions)
      const bridgesWithHistory = new Set([...usedBridgeIds]);
      
      // Add bridges whose versions have history
      usedVersionIds.forEach(versionId => {
        const version = versionMap.get(versionId);
        if (version && version.parent_id) {
          bridgesWithHistory.add(version.parent_id.toString());
        }
      });
      
      // Find all connected agents for bridges with history (recursive)
      const protectedBridgeIds = new Set(bridgesWithHistory);
      
      bridgesWithHistory.forEach(bridgeId => {
        const connectedAgents = findAllConnectedAgents(bridgeId);
        connectedAgents.forEach(connectedId => {
          protectedBridgeIds.add(connectedId);
        });
      });
      
      console.log(`Found ${bridgesWithHistory.size} bridges with direct history`);
      console.log(`Found ${protectedBridgeIds.size} total protected bridges (including connected agents)`);
      
      // Step 5: Identify unused bridges and versions, and unarchive archived ones with history
      const bridgesToDelete = [];
      const versionsToDelete = [];
      const bridgesToUnarchive = [];
      const bridgeIdsToDelete = new Set(); // Track bridge IDs being deleted
      
      // Check bridges - only delete if status is 0 and not protected (no history or connected agent dependencies)
      // Also unarchive bridges that are protected but archived (status !== 0)
      for (const bridge of allBridges) {
        const bridgeId = bridge._id.toString();
        const hasStatusZero = bridge.status === 0;
        const isProtected = protectedBridgeIds.has(bridgeId);
        
        if (!isProtected && hasStatusZero) {
          // Not protected and archived - safe to delete
          bridgesToDelete.push(bridge._id);
          bridgeIdsToDelete.add(bridgeId);
        } else if (isProtected && !hasStatusZero) {
          // Protected but is archived - unarchive it
          bridgesToUnarchive.push(bridge._id);
          console.log(`Will unarchive bridge ${bridgeId} (protected by history or connected agents but status is ${bridge.status})`);
        } else if (!isProtected && !hasStatusZero) {
          console.log(`Skipping bridge ${bridgeId} because status is ${bridge.status} (not 0)`);
        } else if (isProtected && hasStatusZero) {
          console.log(`Skipping bridge ${bridgeId} because it's protected by history or connected agents`);
        }
      }
      
      // Check versions - only delete if:
      // 1. The version_id is not used in conversations, AND
      // 2. The parent bridge (parent_id) is being deleted (not protected by history or connected agents)
      // Note: Parent bridge protection is already handled in the bridge checking logic above
      for (const version of allVersions) {
        const versionId = version._id.toString();
        const parentBridgeId = version.parent_id ? version.parent_id.toString() : null;
        const hasHistory = usedVersionIds.has(versionId);
        
        if (!hasHistory) {
          // Check if parent bridge is being deleted
          const parentBridgeBeingDeleted = parentBridgeId && bridgeIdsToDelete.has(parentBridgeId);
          
          if (parentBridgeBeingDeleted) {
            // Safe to delete this version since parent bridge is being deleted
            versionsToDelete.push(version._id);
          } else if (!parentBridgeId) {
            // No parent bridge reference, safe to delete
            versionsToDelete.push(version._id);
          } else {
            console.log(`Skipping version ${versionId} because parent bridge ${parentBridgeId} is not being deleted (protected or status != 0)`);
          }
        } else {
          console.log(`Skipping version ${versionId} because it has history in conversations`);
        }
      }
      
      console.log(`Identified ${bridgesToDelete.length} bridges and ${versionsToDelete.length} versions for deletion`);
      console.log(`Identified ${bridgesToUnarchive.length} bridges for unarchiving (based on history and connected agent dependencies)`);
      
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
      let updatedApikeys = 0;
      let updatedApiCalls = 0;
      let deletedApiCalls = 0;
      
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
      
      // Step 8: Update ApikeyCredentials to remove deleted version IDs
      // If an apikey's version_ids array becomes empty after removal, delete the apikey
      if (versionsToDelete.length > 0) {
        // Create a set of deleted version IDs as strings for easy lookup
        const deletedVersionIdsSet = new Set(
          versionsToDelete.map(id => id.toString())
        );
        
        // Find all apikey documents that contain any of the deleted version IDs
        const apikeysToUpdate = await apikeyModel.find({
          version_ids: { $in: Array.from(deletedVersionIdsSet) }
        }).lean();
        
        console.log(`Found ${apikeysToUpdate.length} apikey documents that contain deleted version IDs`);
        
        for (const apikey of apikeysToUpdate) {
          // Filter out deleted version IDs from the version_ids array
          const updatedVersionIds = apikey.version_ids.filter(
            versionId => !deletedVersionIdsSet.has(versionId.toString())
          );
          
          if (updatedVersionIds.length !== apikey.version_ids.length) {
            // Update the apikey document with the filtered version_ids array
            await apikeyModel.updateOne(
              { _id: apikey._id },
              { $set: { version_ids: updatedVersionIds } }
            );
            updatedApikeys++;
            console.log(`Updated apikey ${apikey._id} (removed ${apikey.version_ids.length - updatedVersionIds.length} deleted version IDs)`);
          }
        }
        
        console.log(`Updated ${updatedApikeys} apikey documents (removed deleted version IDs)`);
      }
      
      // Step 9: Update apicalls to remove deleted bridge and version IDs
      // If both bridge_ids and version_ids arrays become empty, delete the apicall
      if (bridgesToDelete.length > 0 || versionsToDelete.length > 0) {
        // Create sets of deleted IDs as strings for easy lookup
        const deletedBridgeIdsSet = new Set(
          bridgesToDelete.map(id => id.toString())
        );
        const deletedVersionIdsSet = new Set(
          versionsToDelete.map(id => id.toString())
        );
        
        // Find all apicall documents that contain any of the deleted bridge or version IDs
        // bridge_ids might be stored as ObjectIds, so include both ObjectIds and strings in the query
        const deletedBridgeObjectIds = bridgesToDelete; // Already ObjectIds
        const deletedBridgeIdsArray = Array.from(deletedBridgeIdsSet); // Strings
        const deletedVersionIdsArray = Array.from(deletedVersionIdsSet); // Strings
        
        const apiCallsToUpdate = await apiCallModel.find({
          $or: [
            { bridge_ids: { $in: [...deletedBridgeObjectIds, ...deletedBridgeIdsArray] } },
            { version_ids: { $in: deletedVersionIdsArray } }
          ]
        }).lean();
        
        console.log(`Found ${apiCallsToUpdate.length} apicall documents that contain deleted bridge or version IDs`);
        
        for (const apiCall of apiCallsToUpdate) {
          // Filter out deleted bridge IDs from bridge_ids array
          // Handle both ObjectId and string formats
          const updatedBridgeIds = (apiCall.bridge_ids || []).filter(bridgeId => {
            const bridgeIdStr = bridgeId?.toString ? bridgeId.toString() : String(bridgeId);
            return !deletedBridgeIdsSet.has(bridgeIdStr);
          });
          
          // Filter out deleted version IDs from version_ids array
          // Handle both ObjectId and string formats
          const updatedVersionIds = (apiCall.version_ids || []).filter(versionId => {
            const versionIdStr = versionId?.toString ? versionId.toString() : String(versionId);
            return !deletedVersionIdsSet.has(versionIdStr);
          });
          
          // Check if both arrays are empty
          if (updatedBridgeIds.length === 0 && updatedVersionIds.length === 0) {
            // If both arrays are empty, delete the apicall document
            await apiCallModel.deleteOne({ _id: apiCall._id });
            deletedApiCalls++;
            console.log(`Deleted apicall ${apiCall._id} (no bridge_ids or version_ids remaining)`);
          } else if (
            updatedBridgeIds.length !== (apiCall.bridge_ids || []).length ||
            updatedVersionIds.length !== (apiCall.version_ids || []).length
          ) {
            // Update the apicall document with the filtered arrays
            await apiCallModel.updateOne(
              { _id: apiCall._id },
              { 
                $set: { 
                  bridge_ids: updatedBridgeIds,
                  version_ids: updatedVersionIds
                } 
              }
            );
            updatedApiCalls++;
            const removedBridges = (apiCall.bridge_ids || []).length - updatedBridgeIds.length;
            const removedVersions = (apiCall.version_ids || []).length - updatedVersionIds.length;
            console.log(`Updated apicall ${apiCall._id} (removed ${removedBridges} bridge IDs and ${removedVersions} version IDs)`);
          }
        }
        
        console.log(`Updated ${updatedApiCalls} apicall documents and deleted ${deletedApiCalls} empty apicall documents`);
      }
      
      await transaction.commit();
      
      console.log('Migration completed successfully!');
      console.log(`Summary: Deleted ${deletedBridges} bridges and ${deletedVersions} versions`);
      console.log(`Summary: Unarchived ${unarchivedBridges} bridges (based on history and connected agent dependencies)`);
      console.log(`Summary: Updated ${updatedApikeys} apikey documents (removed deleted version IDs)`);
      console.log(`Summary: Updated ${updatedApiCalls} apicall documents and deleted ${deletedApiCalls} empty apicall documents`);
      
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
