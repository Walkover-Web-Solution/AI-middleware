import axios from "axios";

async function sendAgentCreatedWebhook(agent, org_id) {
  try {
    await axios.post("https://flow.sokt.io/func/scri9w2PTIdD", [
      {
        _id: { $oid: agent._id.toString() },
        name: agent.name,
        org_id: org_id.toString()
      }
    ]);
    return true;
  } catch (error) {
    console.error("Error sending agent created webhook:", error);
    return false;
  }
}

export { sendAgentCreatedWebhook };
