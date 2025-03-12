import models from '../../models/index.js';
import { Op } from 'sequelize';
import configurationService  from '../db_services/ConfigurationServices.js';

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

    // Execute the bridge stats query
    const bridgeStatsQuery = `
      WITH bridge_stats AS (
        SELECT
          c.bridge_id,
          COUNT(c.id) AS hits,
          SUM(rd.input_tokens + rd.output_tokens) AS total_tokens_used,
          SUM(rd.expected_cost) AS total_cost
        FROM
          conversations c
        JOIN
          raw_data rd ON c.message_id = rd.message_id
        WHERE
          c.message_by = 'user'
          AND c."createdAt" >= date_trunc('month', current_date) - interval '1 month'
          AND c."createdAt" < date_trunc('month', current_date)
        GROUP BY
          c.bridge_id
      )
      SELECT
        bs.bridge_id AS "bridge_id",
        bs.hits,
        bs.total_tokens_used AS "Tokens Used",
        bs.total_cost AS "Cost"
      FROM
        bridge_stats bs
      ORDER BY
        bs.hits DESC
      LIMIT 3;
    `;

    const bridgeStats = await models.pg.sequelize.query(bridgeStatsQuery, {
      type: models.pg.sequelize.QueryTypes.SELECT
    });
    for(let i = 0; i < bridgeStats.length; i++) {
      const bridge_id = bridgeStats[i].bridge_id
      bridgeStats[i].BridgeName = await configurationService.getBridgeNameById(bridge_id, org_id)

    }

    

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
          totalHits: totalHits,
          totalTokensConsumed: totalTokensConsumed,
          totalCost: totalCost
        },
      ],
      topBridgesTable: bridgeStats,
      NewBridgesCreated: topBridges.length,
      PerformanceMetrics: {
        totalErrors: totalErrorsFailures
      },
      ClientFeedback: {
        dislike: totalDislikes,
        positiveFeedback: totalPositiveFeedback
      }
    };

    results.push(orgData);
  }

  return results;
}

export default get_data_from_pg;
