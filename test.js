import { MongoClient, ObjectId } from 'mongodb';
const client = new MongoClient('mongodb+srv://admin:Uc0sjm9jpLMsSGn5@cluster0.awdsppv.mongodb.net/AI_Middleware?retryWrites=true&w=majority');
try {
    await client.connect();
    const db = client.db("AI_Middleware");
    const configurations = db.collection("configurations");
    
    // Find all configurations with connected_agents
    const cursor = configurations.find({ connected_agents: { $exists: true } });
    
    while (await cursor.hasNext()) {
        const configDoc = await cursor.next();
        const connectedAgents = configDoc.connected_agents || {};
        
        // Process each agent in connected_agents
        for (const [agentName, agentData] of Object.entries(connectedAgents)) {
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
    
    console.log("Migration completed successfully");
} catch (error) {
    console.error("Configuration migration failed:", error);
} finally {
    await client.close();
}