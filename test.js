import { MongoClient } from "mongodb";

const MONGODB_URI = 'mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware-test';

async function updateModelConfigurationLevels() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("gtwy-local");
    const collection = db.collection("modelconfigurations");

    const result = await collection.updateMany(
      {},
      {
        $set: {
          "configuration.max_tokens.level": 2,
          "configuration.response_type.level": 2,
          updated_at: new Date()
        }
      }
    );

    console.log("========================================");
    console.log("Update Summary:");
    console.log(`  Matched documents:  ${result.matchedCount}`);
    console.log(`  Modified documents: ${result.modifiedCount}`);
    console.log("========================================");

  } catch (error) {
    console.error("Update failed:", error);
    throw error;
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

// Run migration
updateModelConfigurationLevels()
  .then(() => {
    console.log("✓ Level update completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ Level update failed:", err);
    process.exit(1);
  });