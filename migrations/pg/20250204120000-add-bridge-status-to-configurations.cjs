"use strict";

const { MongoClient } = require("mongodb");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up() {
    const mongoUrl = process.env.MONGODB_CONNECTION_URI;
    const dbName = process.env.MONGODB_DATABASE_NAME;

    if (!mongoUrl) {
      throw new Error("MONGODB_CONNECTION_URI is not defined in the environment");
    }
    if (!dbName) {
      throw new Error("MONGODB_DATABASE_NAME is not defined in the environment");
    }

    const client = new MongoClient(mongoUrl);

    try {
      console.log("Starting migration: ensure configurations have bridge_status = 1 when missing");
      await client.connect();
      const db = client.db(dbName);
      const configurations = db.collection("configurations");
      const apiCalls = db.collection("apicalls");

      const filter = {
        $or: [{ bridge_status: { $exists: false } }, { bridge_status: null }]
      };

      const update = { $set: { bridge_status: 1 } };
      const result = await configurations.updateMany(filter, update);

      console.log(`Matched ${result.matchedCount} configuration documents; updated ${result.modifiedCount} documents with bridge_status = 1`);

      // Normalize apicall bridge_ids field so null values become empty arrays
      console.log("Normalizing apicall bridge_ids field (null -> [])");
      const bridgeIdsNullFilter = {
        $or: [{ bridge_ids: { $exists: false } }, { bridge_ids: null }]
      };

      const apiCallsNeedingNormalization = await apiCalls.countDocuments(bridgeIdsNullFilter);
      if (apiCallsNeedingNormalization === 0) {
        console.log("No apicall documents with null/missing bridge_ids found; skipping normalization");
      } else {
        const normalizationResult = await apiCalls.updateMany(bridgeIdsNullFilter, { $set: { bridge_ids: [] } });
        console.log(
          `Matched ${normalizationResult.matchedCount} apicall documents; normalized ${normalizationResult.modifiedCount} bridge_ids arrays`
        );
      }
    } catch (error) {
      console.error("Error while running bridge_status/apicall migration:", error);
      throw error;
    } finally {
      await client.close();
      console.log("MongoDB connection closed after bridge_status/apicall migration");
    }
  },

  async down() {
    console.log("Down migration is not implemented for this MongoDB data backfill/conversion.");
  }
};
