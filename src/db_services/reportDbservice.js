import models from '../../models/index.js';
import { Op } from 'sequelize';

async function get_data_from_pg(org_ids) {
  const results = [];

  // Get the start and end of the previous month
  const now = new Date();
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0); // last day of the previous month

  // Loop through all org_ids
  for (let org_id of org_ids) {
    // Initialize variables to store totals
    org_id = org_id.toString();
    let totalHits = 0;
    let totalTokensConsumed = 0;
    let totalCost = 0;
    let totalErrorsFailures = 0;
    let totalDislikes = 0;
    let totalPositiveFeedback = 0;
    const topBridges = [];

    // Fetch all conversations related to the org_id for the previous month
    const conversations = await models.pg.conversations.findAll({
      where: {
        org_id,
        createdAt: {
          [Op.gte]: firstDayOfLastMonth,  // greater than or equal to the first day of last month
          [Op.lte]: lastDayOfLastMonth,   // less than or equal to the last day of last month
        }
      },
      attributes: ['bridge_id', 'message_by', 'message', 'tools_call_data', 'createdAt', 'message_id']
    });

    // Fetch all raw data related to the org_id for the previous month
    const rawData = await models.pg.raw_data.findAll({
      where: {
        org_id,
        created_at: {
          [Op.gte]: firstDayOfLastMonth,
          [Op.lte]: lastDayOfLastMonth,
        }
      },
      attributes: ['service', 'status', 'input_tokens', 'output_tokens', 'expected_cost', 'message_id']
    });
    totalHits = rawData.length;

    // Iterate through the conversations to accumulate usage data
    conversations.forEach(conversation => {
      const bridgeId = conversation.bridge_id;

      // Extract tokens and cost from raw_data
      const correspondingRawData = rawData.find(data => data.message_id === conversation.message_id);
      if (correspondingRawData) {
        totalTokensConsumed += correspondingRawData.input_tokens + correspondingRawData.output_tokens;
        totalCost += correspondingRawData.expected_cost;
      }

      // If there's a tool call, add to the bridge data
      if (conversation.tools_call_data) {
        // We can assume tool calls are important for bridges, count hits for each bridge
        let bridgeData = topBridges.find(bridge => bridge.BridgeName === bridgeId);
        if (!bridgeData) {
          bridgeData = { BridgeName: bridgeId, Hits: 0, TokensUsed: 0, Cost: 0 };
          topBridges.push(bridgeData);
        }
        bridgeData.Hits++;
        bridgeData.TokensUsed += correspondingRawData ? (correspondingRawData.input_tokens + correspondingRawData.output_tokens) : 0;
        bridgeData.Cost += correspondingRawData ? correspondingRawData.expected_cost : 0;
      }
    });

    // Fetch feedback from conversations
    const feedbackData = await models.pg.conversations.findAll({
      where: {
        org_id,
        createdAt: {
          [Op.gte]: firstDayOfLastMonth,
          [Op.lte]: lastDayOfLastMonth,
        }
      },
      attributes: ['user_feedback']
    });

    feedbackData.forEach(feedback => {
      if (feedback.user_feedback) {
        const feedbackJson = JSON.parse(feedback.user_feedback);
        totalDislikes += feedbackJson.Dislikes || 0;
        totalPositiveFeedback += feedbackJson.PositiveFeedback || 0;
      }
    });

    // Calculate the total errors and failures from raw_data
    const errorData = await models.pg.raw_data.findAll({
      where: {
        org_id,
        error: {
          [Op.ne]: ''  // Select records where the error column is not empty
        },
        created_at: {
          [Op.gte]: firstDayOfLastMonth,
          [Op.lte]: lastDayOfLastMonth,
        }
      },
      attributes: ['id']
    });
    totalErrorsFailures = errorData.length;

    // Create the final JSON for this org_id
    const orgData = {
      UsageOverview: [
        {
          bridgeName: 10,
          TotalHits: totalHits,
          TotalTokensConsumed: totalTokensConsumed,
          TotalCost: totalCost
        },
      ],
      TopBridges: topBridges,
      NewBridgesCreated: topBridges.length,
      PerformanceMetrics: {
        TotalErrorsFailures: totalErrorsFailures
      },
      ClientFeedback: {
        Dislikes: totalDislikes,
        PositiveFeedback: totalPositiveFeedback
      }
    };

    results.push(orgData);
  }

  return results;
}


// async function get_data_from_pg(org_ids) {
//   const results = [];

//   // Loop through all org_ids
//   for (let org_id of org_ids) {
//     // Initialize variables to store totals
//     org_id = org_id.toString();
//     let totalHits = 0;
//     let totalTokensConsumed = 0;
//     let totalCost = 0;
//     let totalErrorsFailures = 0;
//     let totalDislikes = 0;
//     let totalPositiveFeedback = 0;
//     const topBridges = [];

//     // Fetch all conversations related to the org_id
//     const conversations =  await models.pg.conversations.findAll({
//       where: { org_id},
//       attributes: ['bridge_id', 'message_by', 'message', 'tools_call_data', 'createdAt']
//     });

//     // Fetch all raw data related to the org_id
//     const rawData = await models.pg.raw_data.findAll({
//       where: { org_id },
//       attributes: ['service', 'status', 'input_tokens', 'output_tokens', 'expected_cost', 'message_id']
//     });

//     // Iterate through the conversations to accumulate usage data
//     conversations.forEach(conversation => {
//       const bridgeId = conversation.bridge_id;
//       const messageBy = conversation.message_by;

//       // TotalHits calculation (every conversation counts as a hit)
//       totalHits++;

//       // Extract tokens and cost from raw_data
//       const correspondingRawData = rawData.find(data => data.message_id === conversation.message_id);
//       if (correspondingRawData) {
//         totalTokensConsumed += correspondingRawData.input_tokens + correspondingRawData.output_tokens;
//         totalCost += correspondingRawData.expected_cost;
//       }

//       // If there's a tool call, add to the bridge data
//       if (conversation.tools_call_data) {
//         // We can assume tool calls are important for bridges, count hits for each bridge
//         let bridgeData = topBridges.find(bridge => bridge.BridgeName === bridgeId);
//         if (!bridgeData) {
//           bridgeData = { BridgeName: bridgeId, Hits: 0, TokensUsed: 0, Cost: 0 };
//           topBridges.push(bridgeData);
//         }
//         bridgeData.Hits++;
//         bridgeData.TokensUsed += correspondingRawData ? (correspondingRawData.input_tokens + correspondingRawData.output_tokens) : 0;
//         bridgeData.Cost += correspondingRawData ? correspondingRawData.expected_cost : 0;
//       }
//     });

//     // Fetch feedback from conversations
//     const feedbackData = await models.pg.conversations.findAll({
//       where: { org_id },
//       attributes: ['user_feedback']
//     });

//     feedbackData.forEach(feedback => {
//       if (feedback.user_feedback) {
//         const feedbackJson = JSON.parse(feedback.user_feedback);
//         totalDislikes += feedbackJson.Dislikes || 0;
//         totalPositiveFeedback += feedbackJson.PositiveFeedback || 0;
//       }
//     });

//     // Calculate the total errors and failures
//     const errorData = await models.pg.raw_data.findAll({
//       where: { org_id, status: 'error' },  // Assuming 'error' status signifies failures
//       attributes: ['id']
//     });
//     totalErrorsFailures = errorData.length;

//     // Create the final JSON for this org_id
//     const orgData = {
//       UsageOverview: [
//         {
//           bridgeName: 10,
//           TotalHits: totalHits,
//           TotalTokensConsumed: totalTokensConsumed,
//           TotalCost: totalCost
//         },
//       ],
//       TopBridges: topBridges,
//       NewBridgesCreated: topBridges.length,
//       PerformanceMetrics: {
//         TotalErrorsFailures: totalErrorsFailures
//       },
//       ClientFeedback: {
//         Dislikes: totalDislikes,
//         PositiveFeedback: totalPositiveFeedback
//       }
//     };

//     results.push(orgData);
//   }

//   return results;
// }

export default get_data_from_pg;
