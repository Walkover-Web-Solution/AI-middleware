import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority');

try {
    await client.connect();
    const db = client.db("AI_Middleware");
    const configurations = db.collection("configurations");
    const configurationVersions = db.collection("configuration_versions");
    
    // Find all configurations
    const cursor = configurations.find({});
    
    while (await cursor.hasNext()) {
        const configDoc = await cursor.next();
        let mergedConnectedAgents = { ...configDoc.connected_agents } || {};
        
        // Process versions array if it exists
        if (configDoc.versions && Array.isArray(configDoc.versions)) {
            console.log(`Processing versions for configuration ${configDoc._id}`);
            
            for (const versionId of configDoc.versions) {
                let queryVersionId = null;
                
                // Convert versionId to ObjectId if needed
                if (versionId instanceof ObjectId) {
                    queryVersionId = versionId;
                } else if (ObjectId.isValid(versionId)) {
                    queryVersionId = new ObjectId(versionId);
                } else {
                    console.log(`Invalid version ID ${versionId} in configuration ${configDoc._id}`);
                    continue;
                }
                
                // Fetch configuration version document
                const versionDoc = await configurationVersions.findOne({ _id: queryVersionId });
                
                if (!versionDoc) {
                    console.log(`No configuration_version found with _id ${versionId}`);
                    continue;
                }
                
                // Merge connected_agents from version if it exists
                if (versionDoc.connected_agents) {
                    console.log(`Found connected_agents in version ${versionId}`);
                    
                    for (const [agentName, versionAgentData] of Object.entries(versionDoc.connected_agents)) {
                        // Only add if key doesn't exist in main configuration or merge additional properties
                        if (!mergedConnectedAgents[agentName]) {
                            mergedConnectedAgents[agentName] = versionAgentData;
                            console.log(`Added agent ${agentName} from version ${versionId} to configuration ${configDoc._id}`);
                        } else {
                            // Merge properties that exist in version but not in main config
                            for (const [key, value] of Object.entries(versionAgentData)) {
                                if (!mergedConnectedAgents[agentName][key]) {
                                    mergedConnectedAgents[agentName][key] = value;
                                    console.log(`Added property ${key} for agent ${agentName} from version ${versionId}`);
                                }
                            }
                        }
                    }
                }
            }
            
            // Update the main configuration with merged connected_agents
            if (Object.keys(mergedConnectedAgents).length > 0) {
                await configurations.updateOne(
                    { _id: configDoc._id },
                    { $set: { connected_agents: mergedConnectedAgents } }
                );
                console.log(`Updated merged connected_agents for configuration ${configDoc._id}`);
            }
        }
        
        // Now perform the original migration logic on merged connected_agents
        if (Object.keys(mergedConnectedAgents).length > 0) {
            console.log(`Starting agent migration for configuration ${configDoc._id}`);
            
            for (const [agentName, agentData] of Object.entries(mergedConnectedAgents)) {
                const bridgeId = agentData.bridge_id;
                
                if (!bridgeId) {
                    console.log(`No bridge_id found for agent ${agentName} in configuration ${configDoc._id}`);
                    continue;
                }
                
                // Convert bridge_id to ObjectId if it's a string
                let queryId = null;
                if (bridgeId instanceof ObjectId) {
                    queryId = bridgeId;
                } else if (ObjectId.isValid(bridgeId)) {
                    queryId = new ObjectId(bridgeId);
                } else {
                    console.log(`Invalid bridge_id ${bridgeId} for agent ${agentName}`);
                    continue;
                }
                
                // Find the corresponding configuration document using bridge_id as _id
                const targetConfigDoc = await configurations.findOne({ _id: queryId });
                
                if (!targetConfigDoc) {
                    console.log(`No configuration found with _id ${bridgeId} for agent ${agentName}`);
                    continue;
                }
                
                // Prepare agent_details object
                const agentDetails = {
                    agent_variables: agentData.agent_variables || { fields: {}, required_params: [] },
                    description: agentData.description || "agent data"
                };
                
                // Add agent_details to the target configuration document
                await configurations.updateOne(
                    { _id: queryId },
                    { $set: { agent_details: agentDetails } }
                );
                
                console.log(`Added agent_details to configuration ${bridgeId} for agent ${agentName}`);
                
                // Remove agent_variables and description from connected_agents
                const updatedAgentData = { ...agentData };
                delete updatedAgentData.agent_variables;
                delete updatedAgentData.description;
                
                // Update the configurations document to remove the keys
                await configurations.updateOne(
                    { _id: configDoc._id },
                    { $set: { [`connected_agents.${agentName}`]: updatedAgentData } }
                );
                
                console.log(`Removed agent_variables and description from connected_agents.${agentName} in configuration ${configDoc._id}`);
            }
        }
    }
    
    console.log("Migration completed successfully");
} catch (error) {
    console.error("Configuration migration failed:", error);
} finally {
    await client.close();
}