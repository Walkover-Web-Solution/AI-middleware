import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = "mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware-test";

// Function to clean title - removes all characters except alphanumeric, underscore, and hyphen
function makeFunctionName(name) {
  if (!name) return "";
  return name.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function migrateApiCallsToV2() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("AI_Middleware-test");
    const apiCalls = db.collection("apicalls");

    // Find all documents that need migration
    // Check for: array fields, missing bridge_ids, endpoint_name exists, function_name exists (needs rename), or missing title
    const cursor = apiCalls.find({
      $or: [
        { fields: { $type: "array" } }, // Old array format
        { endpoint_name: { $exists: true } }, // Has endpoint_name to migrate
        { bridge_ids: { $exists: false } }, // Missing bridge_ids
        { old_fields: { $exists: false } }, // Not yet migrated (no backup)
        { function_name: { $exists: true } }, // Has function_name (needs to be renamed to script_id)
        { title: { $exists: false } }, // Missing title field
        { script_id: { $exists: false } } // Missing script_id field
      ]
    });

    let migratedCount = 0;
    let skippedCount = 0;

    while (await cursor.hasNext()) {
      const apiCall = await cursor.next();
      const apiCallId = apiCall._id;

      console.log(`\nProcessing API Call: ${apiCallId} (${apiCall.script_id || apiCall.function_name || "N/A"})`);

      try {
        // Prepare the update object
        const updateDoc = {
          $set: {
            updated_at: new Date()
          },
          $unset: {}
        };

        // Convert fields from array format to object format if needed
        if (Array.isArray(apiCall.fields)) {
          console.log(`  Converting fields from array to object format`);
          const fieldsObject = {};

          apiCall.fields.forEach((field) => {
            const variableName = field.variable_name;
            if (variableName) {
              fieldsObject[variableName] = {
                description: field.description || "",
                type: field.type || "string",
                enum: Array.isArray(field.enum) ? field.enum : field.enum === "" || !field.enum ? [] : [field.enum],
                required_params: field.required_params || [],
                parameter: field.parameter || {}
              };
            }
          });

          // Store old fields as backup
          updateDoc.$set.old_fields = apiCall.fields;
          updateDoc.$set.fields = fieldsObject;

          console.log(`  Converted ${Object.keys(fieldsObject).length} fields`);
        }
        // If fields is already an object but not in v2 format, normalize it
        else if (apiCall.fields && typeof apiCall.fields === "object" && !Array.isArray(apiCall.fields)) {
          console.log(`  Normalizing existing object fields`);
          const normalizedFields = {};

          for (const [key, value] of Object.entries(apiCall.fields)) {
            normalizedFields[key] = {
              description: value.description || "",
              type: value.type || "string",
              enum: Array.isArray(value.enum) ? value.enum : value.enum === "" || !value.enum ? [] : [value.enum],
              required_params: value.required_params || [],
              parameter: value.parameter || {}
            };
          }

          if (!apiCall.old_fields) {
            updateDoc.$set.old_fields = apiCall.fields;
          }
          updateDoc.$set.fields = normalizedFields;
        }
        // If fields doesn't exist, set it to empty object
        else if (!apiCall.fields) {
          console.log(`  Setting empty fields object`);
          updateDoc.$set.fields = {};
        }

        // Ensure bridge_ids is an array
        if (!apiCall.bridge_ids) {
          updateDoc.$set.bridge_ids = [];
        }

        // Convert bridge_id to bridge_ids array if it exists and bridge_ids is empty
        if (apiCall.bridge_id && (!apiCall.bridge_ids || apiCall.bridge_ids.length === 0)) {
          console.log(`  Migrating bridge_id to bridge_ids array`);
          const bridgeObjectId = ObjectId.isValid(apiCall.bridge_id) ? new ObjectId(apiCall.bridge_id) : apiCall.bridge_id;
          updateDoc.$set.bridge_ids = [bridgeObjectId];
        }

        // Ensure required_params is an array
        if (!Array.isArray(apiCall.required_params)) {
          updateDoc.$set.required_params = [];
        }

        // Set default status if not exists
        if (apiCall.status === undefined || apiCall.status === null) {
          updateDoc.$set.status = 1;
        }

        // Handle title field - ensure every object has a title
        // Priority: existing title > endpoint_name > function_name
        let titleValue = apiCall.title;

        if (!titleValue || titleValue === null || titleValue === "") {
          console.log(`  Title is empty, checking endpoint_name and function_name`);

          // First priority: endpoint_name
          if (apiCall.endpoint_name && apiCall.endpoint_name !== "") {
            titleValue = apiCall.endpoint_name;
            console.log(`  Using endpoint_name for title: "${titleValue}"`);
          }
          // Second priority: function_name
          else if (apiCall.function_name && apiCall.function_name !== "") {
            titleValue = apiCall.function_name;
            console.log(`  Using function_name for title: "${titleValue}"`);
          }
        }

        // Clean the title value using makeFunctionName
        if (titleValue) {
          const cleanedTitle = makeFunctionName(titleValue);
          if (cleanedTitle !== titleValue) {
            console.log(`  Cleaning title: "${titleValue}" → "${cleanedTitle}"`);
          }
          updateDoc.$set.title = cleanedTitle;
        } else {
          // If no title found anywhere, set empty string
          updateDoc.$set.title = "";
          console.log(`  No title source found, setting empty string`);
        }

        // Rename function_name to script_id
        if (apiCall.function_name !== undefined) {
          console.log(`  Renaming function_name to script_id`);
          updateDoc.$set.script_id = apiCall.function_name;
          updateDoc.$unset.function_name = "";
        }

        // Delete endpoint_name field
        if (apiCall.endpoint_name !== undefined) {
          console.log(`  Removing endpoint_name field`);
          updateDoc.$unset.endpoint_name = "";
        }

        // Clean up old Python-related fields
        if (apiCall.is_python !== undefined) {
          console.log(`  Removing is_python field`);
          updateDoc.$unset.is_python = "";
        }

        if (apiCall.code !== undefined) {
          console.log(`  Removing code field`);
          updateDoc.$unset.code = "";
        }

        // Remove version field if it exists
        if (apiCall.version !== undefined) {
          console.log(`  Removing version field`);
          updateDoc.$unset.version = "";
        }

        // Remove $unset if empty
        if (Object.keys(updateDoc.$unset).length === 0) {
          delete updateDoc.$unset;
        }

        // Perform the update
        const result = await apiCalls.updateOne({ _id: apiCallId }, updateDoc);

        if (result.modifiedCount > 0) {
          migratedCount++;
          console.log(`  ✓ Successfully migrated`);
        } else {
          skippedCount++;
          console.log(`  - No changes needed`);
        }
      } catch (error) {
        console.error(`  ✗ Error migrating API Call ${apiCallId}:`, error.message);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Migration Summary:");
    console.log(`  Total migrated: ${migratedCount}`);
    console.log(`  Total skipped: ${skippedCount}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed");
  }
}

// Run the migration
migrateApiCallsToV2()
  .then(() => {
    console.log("\n✓ Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  });
