import models from '../../models/index.js';
import { Op } from 'sequelize';
import configurationService from '../db_services/ConfigurationServices.js';

async function get_data_from_pg(org_ids) {
  const results = [];

  // Get the start and end of the previous month
  const now = new Date();
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Prepare common date filters to avoid duplication
  const conversationDateFilter = {
    [Op.gte]: firstDayOfLastMonth,
    [Op.lte]: lastDayOfLastMonth,
  };

  for (let org_id of org_ids) {
    org_id = org_id.toString();

    // Prepare the SQL queries for each organization separately
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
          c.message_by = 'user' AND c.org_id = '${org_id}'
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

    const activeBridgesQuery = `
      SELECT
        COUNT(DISTINCT c.bridge_id) AS active_bridges_count
      FROM
        conversations c
      WHERE
        c.bridge_id IS NOT NULL
        AND c.org_id = '${org_id}'
        AND c."createdAt" >= date_trunc('month', current_date) - interval '1 month'
        AND c."createdAt" < date_trunc('month', current_date);
    `;

    // Use Promise.all to fetch all required data in parallel
    const [
      conversations,
      rawData,
      bridgeStats,
      activeBridges
    ] = await Promise.all([
      // Fetch conversations
      models.pg.conversations.findAll({
        where: {
          org_id,
          createdAt: conversationDateFilter
        },
        attributes: [
          'bridge_id',
          'message_by',
          'message',
          'tools_call_data',
          'createdAt',
          'message_id',
          'user_feedback'
        ]
      }),

      // Fetch rawData
      models.pg.raw_data.findAll({
        where: {
          org_id,
          created_at: conversationDateFilter
        },
        attributes: [
          'service',
          'status',
          'input_tokens',
          'output_tokens',
          'expected_cost',
          'message_id',
          'error'
        ]
      }),

      // Execute bridgeStats query
      models.pg.sequelize.query(bridgeStatsQuery, {
        type: models.pg.sequelize.QueryTypes.SELECT
      }),

      // Execute activeBridges query
      models.pg.sequelize.query(activeBridgesQuery, {
        type: models.pg.sequelize.QueryTypes.SELECT
      })
    ]);

    // Initialize variables to store totals
    let totalHits = 0;
    let totalTokensConsumed = 0;
    let totalCost = 0;
    let totalErrorCount = 0;
    let totalDislikes = 0;
    let totalPositiveFeedback = 0;
    let totalSuccessCount = 0;
    const topBridges = [];

    // totalHits is simply the length of rawData
    totalHits = rawData.length;

    // Build a map (message_id -> rawData row) for quick lookups
    const rawDataMap = new Map();
    for (const r of rawData) {
      rawDataMap.set(r.message_id, r);
    }

    // Resolve activeBridges count
    const activeBridges_count = parseInt(activeBridges[0].active_bridges_count, 10) || 0;

    // Resolve bridge names
    for (let i = 0; i < bridgeStats.length; i++) {
      const bId = bridgeStats[i].bridge_id;
      const bridgeName = await configurationService.getBridgeNameById(bId, org_id);
      bridgeStats[i].BridgeName = bridgeName;
    }

    // Iterate through the conversations to accumulate usage data and feedback
    for (const conversation of conversations) {
      const { bridge_id, message_id, user_feedback } = conversation;

      // Pull tokens/cost from map
      const correspondingRawData = rawDataMap.get(message_id);
      if (correspondingRawData) {
        totalTokensConsumed += correspondingRawData.input_tokens + correspondingRawData.output_tokens;
        totalCost += correspondingRawData.expected_cost;
      }

      // Tools call => track usage in topBridges
      if (conversation.tools_call_data) {
        let bridgeData = topBridges.find(bridge => bridge.BridgeName === bridge_id);
        if (!bridgeData) {
          bridgeData = { BridgeName: bridge_id, Hits: 0, TokensUsed: 0, Cost: 0 };
          topBridges.push(bridgeData);
        }
        bridgeData.Hits++;
        if (correspondingRawData) {
          bridgeData.TokensUsed += (correspondingRawData.input_tokens + correspondingRawData.output_tokens);
          bridgeData.Cost += correspondingRawData.expected_cost;
        }
      }

      // Parse user_feedback from conversation directly
      if (user_feedback) {
        const feedbackJson = JSON.parse(user_feedback);
        if (feedbackJson.Dislikes) {
          totalDislikes += feedbackJson.Dislikes;
        }
        if (feedbackJson.PositiveFeedback) {
          totalPositiveFeedback += feedbackJson.PositiveFeedback;
        }
      }
    }

    // Calculate the total errors vs. successes from the rawData
    for (const r of rawData) {
      if (r.error && r.error.trim() !== '') {
        totalErrorCount++;
      } else {
        totalSuccessCount++;
      }
    }

    // Create the final JSON for this org_id
    const orgData = {
      [org_id]: {
        UsageOverview: {
          totalHits,
          totalTokensConsumed,
          totalCost,
          activeBridges: activeBridges_count
        },
        topBridgesTable: bridgeStats,
        NewBridgesCreated: topBridges.length, // same logic as before
        PerformanceMetrics: {
          totalSuccess: totalSuccessCount,
          totalError: totalErrorCount
        },
        ClientFeedback: {
          dislike: totalDislikes,
          positiveFeedback: totalPositiveFeedback
        }
      }
    };

    results.push(orgData);
  }

  return results;
}

export default get_data_from_pg;