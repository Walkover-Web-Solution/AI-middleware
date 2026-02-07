/* eslint-disable no-unused-vars */
"use strict";

const mongoose = require("mongoose");
require("dotenv").config();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log("Starting cleanup of unused MongoDB bridges and versions...");
      console.log("DEBUG: Migration script is executing - this should appear in logs");

      // Step 1: Check conversations table and get all bridge_ids and version_ids
      // First, let's check if the table exists and has data
      const [tableCheck] = await queryInterface.sequelize.query("SELECT COUNT(*) as total_rows FROM conversations", {
        transaction
      });
      console.log(`Total rows in conversations table: ${tableCheck[0].total_rows}`);

      // Check for non-null bridge_id and version_id counts
      const [bridgeCheck] = await queryInterface.sequelize.query("SELECT COUNT(*) as bridge_count FROM conversations WHERE bridge_id IS NOT NULL", {
        transaction
      });
      const [versionCheck] = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as version_count FROM conversations WHERE version_id IS NOT NULL",
        { transaction }
      );
      console.log(`Rows with bridge_id: ${bridgeCheck[0].bridge_count}, Rows with version_id: ${versionCheck[0].version_count}`);

      // Early exit if no data found
      if (bridgeCheck[0].bridge_count === 0 && versionCheck[0].version_count === 0) {
        console.log("WARNING: No bridge_id or version_id found in conversations table. All bridges will be candidates for deletion.");
      }
      const [bridgeResults] = await queryInterface.sequelize.query("SELECT DISTINCT bridge_id FROM conversations WHERE bridge_id IS NOT NULL", {
        transaction
      });

      const [versionResults] = await queryInterface.sequelize.query("SELECT DISTINCT version_id FROM conversations WHERE version_id IS NOT NULL", {
        transaction
      });

      // Debug: Print raw query results
      console.log("Raw bridgeResults from DB:", JSON.stringify(bridgeResults.slice(0, 5), null, 2)); // Show first 5 results
      console.log("Raw versionResults from DB:", JSON.stringify(versionResults.slice(0, 5), null, 2)); // Show first 5 results
      console.log(`Total bridgeResults count: ${bridgeResults.length}`);
      console.log(`Total versionResults count: ${versionResults.length}`);

      const usedBridgeIds = new Set(bridgeResults.map((row) => row.bridge_id));
      const usedVersionIds = new Set(versionResults.map((row) => row.version_id));

      // Debug: Print processed sets
      console.log("Sample usedBridgeIds:", Array.from(usedBridgeIds).slice(0, 5));
      console.log("Sample usedVersionIds:", Array.from(usedVersionIds).slice(0, 5));

      console.log(`Found ${usedBridgeIds.size} unique bridge_ids and ${usedVersionIds.size} unique version_ids in conversations table`);

      // CRITICAL DEBUG: Force log execution
      console.log("=== CRITICAL DEBUG START ===");
      console.log("usedBridgeIds size:", usedBridgeIds.size);
      console.log("usedVersionIds size:", usedVersionIds.size);
      console.log("=== CRITICAL DEBUG END ===");

      // Step 2: Connect to MongoDB using Mongoose
      mongoose.set("strictQuery", false);
      await mongoose.connect(process.env.MONGODB_CONNECTION_URI);
      console.log("Connected to MongoDB using Mongoose");

      // Step 3: Import Mongoose models
      const configurationModel = (await import("../../src/mongoModel/configuration.js")).default;
      const versionModel = (await import("../../src/mongoModel/bridge_version.js")).default;
      const apikeyModel = (await import("../../src/mongoModel/apiModel.js")).default;
      const apiCallModel = (await import("../../src/mongoModel/apiCall.js")).default;

      // Step 4: Get all MongoDB documents (including status field for bridges, parent_id and status for versions)
      // Get bridges with status 1 for building connected agents dependency map
      const activeBridges = await configurationModel.find({ status: 1 }, { _id: 1, status: 1, connected_agents: 1 }).lean();

      // Get ALL bridges for deletion logic (we need to check archived ones with status 0)
      const allBridges = await configurationModel.find({}, { _id: 1, status: 1, connected_agents: 1 }).lean();

      // Get parent bridge IDs with status 1 (for dependency mapping)
      const parentBridgeIdsWithStatus1 = activeBridges.map((bridge) => bridge._id);

      // Get ALL parent bridge IDs (for version fetching - we need versions of all bridges)
      const allParentBridgeIds = allBridges.map((bridge) => bridge._id);

      // Get versions of active bridges (for dependency mapping)
      const activeBridgeVersions = await versionModel
        .find({ parent_id: { $in: parentBridgeIdsWithStatus1 } }, { _id: 1, parent_id: 1, connected_agents: 1 })
        .lean();

      // Get ALL versions (for deletion logic - including versions of archived bridges)
      const allVersions = await versionModel.find({ parent_id: { $in: allParentBridgeIds } }, { _id: 1, parent_id: 1 }).lean();

      console.log(
        `Found ${allBridges.length} total bridges (${activeBridges.length} active) and ${allVersions.length} total versions (${activeBridgeVersions.length} from active bridges) in MongoDB`
      );

      // Step 4.5: Build connected agents dependency map and find all connected bridge IDs recursively
      const bridgeMap = new Map();
      const versionMap = new Map();

      // Create maps for quick lookup (use activeBridges for dependency mapping)
      activeBridges.forEach((bridge) => {
        bridgeMap.set(bridge._id.toString(), bridge);
      });

      // Use activeBridgeVersions for dependency mapping (only active bridge versions can have meaningful connected agents)
      activeBridgeVersions.forEach((version) => {
        versionMap.set(version._id.toString(), version);
      });

      // Also create a map for ALL versions (for deletion logic)
      const allVersionsMap = new Map();
      allVersions.forEach((version) => {
        allVersionsMap.set(version._id.toString(), version);
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
          Object.values(bridge.connected_agents).forEach((agent) => {
            if (agent && agent.bridge_id) {
              const connectedBridgeId = agent.bridge_id.toString();
              connectedAgentIds.add(connectedBridgeId);

              // Recursively find connected agents of this connected agent
              const nestedConnected = findAllConnectedAgents(connectedBridgeId, new Set(visited));
              nestedConnected.forEach((id) => connectedAgentIds.add(id));
            }
          });
        }

        // Check versions connected_agents for this bridge (only active bridge versions)
        const bridgeVersions = activeBridgeVersions.filter((v) => v.parent_id && v.parent_id.toString() === bridgeId);
        bridgeVersions.forEach((version) => {
          if (version.connected_agents) {
            Object.values(version.connected_agents).forEach((agent) => {
              if (agent && agent.bridge_id) {
                const connectedBridgeId = agent.bridge_id.toString();
                connectedAgentIds.add(connectedBridgeId);

                // Recursively find connected agents of this connected agent
                const nestedConnected = findAllConnectedAgents(connectedBridgeId, new Set(visited));
                nestedConnected.forEach((id) => connectedAgentIds.add(id));
              }
            });
          }
        });

        return connectedAgentIds;
      }

      // Find all bridges that have history (used in conversations or versions)
      const bridgesWithHistory = new Set([...usedBridgeIds]);

      // Add bridges whose versions have history (use allVersionsMap to include all versions)
      usedVersionIds.forEach((versionId) => {
        const version = allVersionsMap.get(versionId);
        if (version && version.parent_id) {
          bridgesWithHistory.add(version.parent_id.toString());
        }
      });

      // Find all connected agents for bridges with history (recursive)
      const protectedBridgeIds = new Set(bridgesWithHistory);

      bridgesWithHistory.forEach((bridgeId) => {
        const connectedAgents = findAllConnectedAgents(bridgeId);
        connectedAgents.forEach((connectedId) => {
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
      // Also unarchive bridges that are protected and archived (status === 0) by changing status to 1
      for (const bridge of allBridges) {
        const bridgeId = bridge._id.toString();
        const hasStatusZero = bridge.status === 0;
        const isProtected = protectedBridgeIds.has(bridgeId);

        if (!isProtected && hasStatusZero) {
          // Not protected and archived - safe to delete
          bridgesToDelete.push(bridge._id);
          bridgeIdsToDelete.add(bridgeId);
        } else if (isProtected && hasStatusZero) {
          // Protected and archived - unarchive it (change status from 0 to 1)
          bridgesToUnarchive.push(bridge._id);
          console.log(
            `Will unarchive bridge ${bridgeId} (protected by history or connected agents but currently archived with status ${bridge.status})`
          );
        } else if (!isProtected && !hasStatusZero) {
          console.log(`Skipping bridge ${bridgeId} because status is ${bridge.status} (not 0)`);
        } else if (isProtected && !hasStatusZero) {
          console.log(`Skipping bridge ${bridgeId} because it's already active (status ${bridge.status}) and protected`);
        }
      }

      // Check versions - delete if:
      // 1. The version_id is not used in conversations, AND
      // 2. Either:
      //    a) The parent bridge is being deleted, OR
      //    b) The parent bridge has status 0 (archived) and is not protected

      console.log(`=== VERSION DELETION DEBUG ===`);
      console.log(`Total versions to check: ${allVersions.length}`);
      console.log(`Bridges being deleted: ${bridgeIdsToDelete.size}`);
      console.log(`Protected bridges: ${protectedBridgeIds.size}`);

      for (const version of allVersions) {
        const versionId = version._id.toString();
        const parentBridgeId = version.parent_id ? version.parent_id.toString() : null;
        const hasHistory = usedVersionIds.has(versionId);

        if (!hasHistory) {
          if (!parentBridgeId) {
            // No parent bridge reference, safe to delete
            versionsToDelete.push(version._id);
            console.log(`Will delete version ${versionId} (no parent bridge reference)`);
          } else {
            // Check parent bridge status and protection
            const parentBridge = allBridges.find((b) => b._id.toString() === parentBridgeId);
            const parentBridgeBeingDeleted = bridgeIdsToDelete.has(parentBridgeId);
            const parentBridgeProtected = protectedBridgeIds.has(parentBridgeId);

            if (parentBridgeBeingDeleted) {
              // Parent bridge is being deleted, so delete this version
              versionsToDelete.push(version._id);
              console.log(`Will delete version ${versionId} (parent bridge ${parentBridgeId} is being deleted)`);
            } else if (parentBridge && parentBridge.status === 0 && !parentBridgeProtected) {
              // Parent bridge is archived and not protected, delete this version
              versionsToDelete.push(version._id);
              console.log(`Will delete version ${versionId} (parent bridge ${parentBridgeId} is archived and not protected)`);
            } else {
              console.log(`Skipping version ${versionId} because parent bridge ${parentBridgeId} is protected or active`);
            }
          }
        } else {
          console.log(`Skipping version ${versionId} because it has history in conversations`);
        }
      }

      // CRITICAL: Check if deleted bridges have versions
      if (bridgesToDelete.length > 0) {
        console.log(`=== DELETED BRIDGE VERSIONS CHECK ===`);
        bridgesToDelete.forEach((bridgeId) => {
          const bridgeIdStr = bridgeId.toString();
          const bridgeVersions = allVersions.filter((v) => v.parent_id && v.parent_id.toString() === bridgeIdStr);
          console.log(
            `Bridge ${bridgeIdStr} has ${bridgeVersions.length} versions:`,
            bridgeVersions.map((v) => v._id.toString())
          );
        });
      }

      console.log(`Identified ${bridgesToDelete.length} bridges and ${versionsToDelete.length} versions for deletion`);
      console.log(`Identified ${bridgesToUnarchive.length} bridges for unarchiving (based on history and connected agent dependencies)`);

      // Step 6: Unarchive bridges that have history but are archived
      // bridgesToUnarchive contains both bridges with history and parent bridges of versions with history
      let unarchivedBridges = 0;

      if (bridgesToUnarchive.length > 0) {
        const bridgeUnarchiveResult = await configurationModel.updateMany({ _id: { $in: bridgesToUnarchive } }, { $set: { status: 1 } });
        unarchivedBridges = bridgeUnarchiveResult.modifiedCount;
        console.log(`Unarchived ${unarchivedBridges} bridges (set status to 1 - active)`);
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
        const deletedVersionIdsSet = new Set(versionsToDelete.map((id) => id.toString()));

        // Find all apikey documents that contain any of the deleted version IDs
        const apikeysToUpdate = await apikeyModel
          .find({
            version_ids: { $in: Array.from(deletedVersionIdsSet) }
          })
          .lean();

        console.log(`Found ${apikeysToUpdate.length} apikey documents that contain deleted version IDs`);

        for (const apikey of apikeysToUpdate) {
          // Filter out deleted version IDs from the version_ids array
          const updatedVersionIds = apikey.version_ids.filter((versionId) => !deletedVersionIdsSet.has(versionId.toString()));

          if (updatedVersionIds.length !== apikey.version_ids.length) {
            // Update the apikey document with the filtered version_ids array
            await apikeyModel.updateOne({ _id: apikey._id }, { $set: { version_ids: updatedVersionIds } });
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
        const deletedBridgeIdsSet = new Set(bridgesToDelete.map((id) => id.toString()));
        const deletedVersionIdsSet = new Set(versionsToDelete.map((id) => id.toString()));

        // Find all apicall documents that contain any of the deleted bridge or version IDs
        // bridge_ids might be stored as ObjectIds, so include both ObjectIds and strings in the query
        const deletedBridgeObjectIds = bridgesToDelete; // Already ObjectIds
        const deletedBridgeIdsArray = Array.from(deletedBridgeIdsSet); // Strings
        const deletedVersionIdsArray = Array.from(deletedVersionIdsSet); // Strings

        const apiCallsToUpdate = await apiCallModel
          .find({
            $or: [{ bridge_ids: { $in: [...deletedBridgeObjectIds, ...deletedBridgeIdsArray] } }, { version_ids: { $in: deletedVersionIdsArray } }]
          })
          .lean();

        console.log(`Found ${apiCallsToUpdate.length} apicall documents that contain deleted bridge or version IDs`);

        for (const apiCall of apiCallsToUpdate) {
          // Filter out deleted bridge IDs from bridge_ids array
          // Handle both ObjectId and string formats
          const updatedBridgeIds = (apiCall.bridge_ids || []).filter((bridgeId) => {
            const bridgeIdStr = bridgeId?.toString ? bridgeId.toString() : String(bridgeId);
            return !deletedBridgeIdsSet.has(bridgeIdStr);
          });

          // Filter out deleted version IDs from version_ids array
          // Handle both ObjectId and string formats
          const updatedVersionIds = (apiCall.version_ids || []).filter((versionId) => {
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

      console.log("Migration completed successfully!");
      console.log(`Summary: Deleted ${deletedBridges} bridges and ${deletedVersions} versions`);
      console.log(`Summary: Unarchived ${unarchivedBridges} bridges (based on history and connected agent dependencies)`);
      console.log(`Summary: Updated ${updatedApikeys} apikey documents (removed deleted version IDs)`);
      console.log(`Summary: Updated ${updatedApiCalls} apicall documents and deleted ${deletedApiCalls} empty apicall documents`);
    } catch (error) {
      await transaction.rollback();
      console.error("Migration failed:", error);
      throw error;
    } finally {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * This migration performs irreversible deletions.
     * To rollback, you would need to restore from a backup.
     *
     * Consider creating a backup before running this migration:
     * mongodump --db your_database_name --collection configurations
     * mongodump --db your_database_name --collection configuration_versions
     */
    console.log("This migration cannot be automatically rolled back.");
    console.log("Please restore from a MongoDB backup if you need to revert these changes.");
  }
};
