import { MongoClient } from 'mongodb';

async function migrateData() {
    const client = new MongoClient('mongodb+srv://Arpitsagarjain:Walkover123@cluster0.eo2iuez.mongodb.net/AI_Middleware?retryWrites=true&w=majority');
    
    try {
        await client.connect();
        const db = client.db("AI_Middleware");
        const configurations = db.collection("apicalls");

        const configCursor = configurations.find({});
        while (await configCursor.hasNext()) {
            const config = await configCursor.next();
            let updateObj = {};

            // Case 1: endpoint to endpoint_name migration
            if (config.endpoint && !config.endpoint_name) {
                updateObj.endpoint_name = config.endpoint;
            }

            // Case 2: endpoint to function_name migration
            if (config.endpoint && !config.function_name) {
                updateObj.function_name = config.endpoint;
            }

            // Case 3: short_description/api_description to description migration
            if (config.short_description) {
                updateObj.description = config.short_description;
                updateObj = { ...updateObj, short_description: "" };
            } else if (config.api_description) {
                updateObj.description = config.api_description;
                updateObj = { ...updateObj, api_description: "" };
            }

            // Case 4: required_fields to required_params migration
            if (config.required_fields) {
                updateObj.required_params = config.required_fields;
                updateObj = { ...updateObj, required_fields: "" };
            }

            // Only perform update if there are changes to make
            if (Object.keys(updateObj).length > 0) {
                await configurations.updateOne(
                    { _id: config._id },
                    {
                        $set: updateObj,
                        $unset: Object.keys(updateObj).reduce((acc, key) => {
                            if (updateObj[key] === "") {
                                acc[key] = "";
                            }
                            return acc;
                        }, {})
                    }
                );
            }
        }

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await client.close();
    }
}

migrateData().catch(console.error);