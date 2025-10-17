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
          ac.bridge_id,
          COUNT(ac.id) AS hits,
          SUM((ac.tokens->>'input_tokens')::float + (ac.tokens->>'output_tokens')::float) AS total_tokens_used,
          SUM((ac.tokens->>'expected_cost')::float) AS total_cost
        FROM
          agent_conversations ac
        WHERE
          ac.user_message IS NOT NULL AND ac.user_message != '' AND ac.org_id = '${org_id}'
          AND ac."createdAt" >= date_trunc('month', current_date) - interval '1 month'
          AND ac."createdAt" < date_trunc('month', current_date)
        GROUP BY
          ac.bridge_id
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
        COUNT(DISTINCT ac.bridge_id) AS active_bridges_count
      FROM
        agent_conversations ac
      WHERE
        ac.bridge_id IS NOT NULL
        AND ac.org_id = '${org_id}'
        AND ac."createdAt" >= date_trunc('month', current_date) - interval '1 month'
        AND ac."createdAt" < date_trunc('month', current_date);
    `;

    // Use Promise.all to fetch all required data in parallel
    const [
      agentConversations,
      bridgeStats,
      activeBridges
    ] = await Promise.all([
      // Fetch agent_conversations (merged data)
      models.pg.agent_conversations.findAll({
        where: {
          org_id,
          createdAt: conversationDateFilter
        },
        attributes: [
          'bridge_id',
          'user_message',
          'response', 
          'chatbot_response',
          'tools_call_data',
          'createdAt',
          'message_id',
          'user_feedback',
          'service',
          'status',
          'tokens',
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

    // totalHits is simply the length of agentConversations
    totalHits = agentConversations.length;

    // No need for separate rawDataMap since data is merged in agent_conversations

    // Resolve activeBridges count
    const activeBridges_count = parseInt(activeBridges[0].active_bridges_count, 10) || 0;

    // Resolve bridge names
    for (let i = 0; i < bridgeStats.length; i++) {
      const bId = bridgeStats[i].bridge_id;
      const bridgeName = await configurationService.getBridgeNameById(bId, org_id);
      bridgeStats[i].BridgeName = bridgeName;
    }

    // Iterate through the agent_conversations to accumulate usage data and feedback
    for (const conversation of agentConversations) {
      const { bridge_id, message_id, user_feedback, error } = conversation;

      // Calculate tokens and cost directly from merged data
      if (conversation.tokens) {
        const tokens = conversation.tokens;
        if (tokens.input_tokens && tokens.output_tokens) {
          totalTokensConsumed += tokens.input_tokens + tokens.output_tokens;
        }
        if (tokens.expected_cost) {
          totalCost += tokens.expected_cost;
        }
      }

      // Tools call => track usage in topBridges
      if (conversation.tools_call_data) {
        let bridgeData = topBridges.find(bridge => bridge.BridgeName === bridge_id);
        if (!bridgeData) {
          bridgeData = { BridgeName: bridge_id, Hits: 0, TokensUsed: 0, Cost: 0 };
          topBridges.push(bridgeData);
        }
        bridgeData.Hits++;
        if (conversation.tokens) {
          const tokens = conversation.tokens;
          if (tokens.input_tokens && tokens.output_tokens) {
            bridgeData.TokensUsed += (tokens.input_tokens + tokens.output_tokens);
          }
          if (tokens.expected_cost) {
            bridgeData.Cost += tokens.expected_cost;
          }
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

      // Calculate errors vs successes directly from merged data
      if (error && error.trim() !== '') {
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

async function get_data_for_daily_report(org_ids) {
  const results = [];
  
  // Get today's date and yesterday's date for daily report
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  // Set time to beginning and end of yesterday
  yesterday.setHours(0, 0, 0, 0);
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);
  
  // Prepare date filter for yesterday
  const dateFilter = {
    [Op.gte]: yesterday,
    [Op.lte]: endOfYesterday,
  };
  
  for (let org_id of org_ids) {
    org_id = org_id.toString();
    
    // Fetch agent_conversations for yesterday
    const agentConversations = await models.pg.agent_conversations.findAll({
      where: {
        org_id,
        createdAt: dateFilter
      },
      attributes: [
        'bridge_id',
        'message_id',
        'error'
      ]
    });
    
    // Create a map to track error counts by bridge_id
    const bridgeErrorCounts = new Map();
    
    // Process each agent_conversation to count errors by bridge
    for (const conversation of agentConversations) {
      const { bridge_id, message_id, error } = conversation;
      
      if (!bridge_id) continue;
      
      // Initialize bridge in map if not exists
      if (!bridgeErrorCounts.has(bridge_id)) {
        bridgeErrorCounts.set(bridge_id, { 
          errorCount: 0,
          totalCount: 0
        });
      }
      
      // Increment total count for this bridge
      const bridgeData = bridgeErrorCounts.get(bridge_id);
      bridgeData.totalCount++;
      
      // Check if there was an error for this message (error data is now in the same table)
      if (error && error.trim() !== '') {
        bridgeData.errorCount++;
      }
    }
    
    // Convert the map to an array of objects with bridge names
    const bridgeErrorReport = [];
    for (const [bridgeId, data] of bridgeErrorCounts.entries()) {
      // Get bridge name from MongoDB
      const bridgeName = await configurationService.getBridgeNameById(bridgeId, org_id);
      
      bridgeErrorReport.push({
        bridge_id: bridgeId,
        bridge_name: bridgeName || 'Unknown Bridge',
        error_count: data.errorCount,
        total_count: data.totalCount,
        error_rate: data.totalCount > 0 ? (data.errorCount / data.totalCount * 100).toFixed(2) + '%' : '0%'
      });
    }
    
    // Sort by error count in descending order
    bridgeErrorReport.sort((a, b) => b.error_count - a.error_count);
    
    // Create the final JSON for this org_id
    const orgData = {
      [org_id]: {
        date: yesterday.toISOString().split('T')[0],
        bridge_error_report: bridgeErrorReport
      }
    };
    
    results.push(orgData);
  }
  
  return results;
}

/**
 * Get date range for report based on type
 * @param {string} reportType - 'monthly' or 'weekly'
 * @returns {Object} Object with startDate and endDate
 */
function getReportDateRange(reportType) {
  const now = new Date();
  
  if (reportType === 'monthly') {
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: firstDayOfLastMonth,
      endDate: lastDayOfLastMonth
    };
  } else if (reportType === 'weekly') {
    const day = now.getDay() || 7; // Convert Sunday (0) to 7 for easier calculation
    const prevMonday = new Date(now);
    prevMonday.setDate(now.getDate() - (day + 6)); // Go back to previous Monday
    prevMonday.setHours(0, 0, 0, 0);
    
    const prevSunday = new Date(prevMonday);
    prevSunday.setDate(prevMonday.getDate() + 6); // Sunday is 6 days after Monday
    prevSunday.setHours(23, 59, 59, 999);
    
    return {
      startDate: prevMonday,
      endDate: prevSunday
    };
  }
  
  throw new Error(`Invalid report type: ${reportType}`);
}

/**
 * Unified function to get latency report data for specified period
 * @param {Array} org_ids - Array of organization IDs
 * @param {string} reportType - 'monthly' or 'weekly'
 * @returns {Array} Report results
 */
async function get_latency_report_data(org_ids, reportType) {
  const results = [];
  const { startDate, endDate } = getReportDateRange(reportType);

  // Prepare date filter
  const dateFilter = {
    [Op.gte]: startDate,
    [Op.lte]: endDate,
  };

  for (let org_id of org_ids) {
    org_id = org_id.toString();

    // Fetch agent_conversations with latency information
    const agentConversations = await models.pg.agent_conversations.findAll({
      where: {
        org_id,
        createdAt: dateFilter
      },
      attributes: ['bridge_id', 'message_id', 'latency']
    });

    // Skip this org if no data is available
    if (agentConversations.length === 0) {
      continue;
    }

    // Create a map to track latency sums and counts by bridge_id
    const bridgeLatencyStats = new Map();

    // Process each conversation to calculate average latency by bridge
    for (const conversation of agentConversations) {
      const { bridge_id, message_id, latency } = conversation;
      
      if (!bridge_id || !latency) continue;

      // Calculate function time logs total
      let functionTimeTotal = 0;
      if (latency.function_time_logs && Array.isArray(latency.function_time_logs)) {
        functionTimeTotal = latency.function_time_logs.reduce((sum, log) => sum + (log.time_taken || 0), 0);
      }

      // Calculate actual latency (overall_time - model_execution_time - function_time_logs)
      const actualLatency = latency.over_all_time - latency.model_execution_time - functionTimeTotal;

      // Initialize or update bridge stats
      if (!bridgeLatencyStats.has(bridge_id)) {
        bridgeLatencyStats.set(bridge_id, {
          totalLatency: 0,
          count: 0
        });
      }

      const stats = bridgeLatencyStats.get(bridge_id);
      stats.totalLatency += actualLatency;
      stats.count++;
    }

    // Skip this org if no valid latency data was found
    if (bridgeLatencyStats.size === 0) {
      continue;
    }

    // Convert the map to an array of objects with bridge names and average latency
    const bridgeLatencyReport = [];
    for (const [bridgeId, stats] of bridgeLatencyStats.entries()) {
      // Get bridge name from service
      const bridgeName = await configurationService.getBridgeNameById(bridgeId, org_id);
      
      bridgeLatencyReport.push({
        bridge_id: bridgeId,
        bridge_name: bridgeName || 'Unknown Bridge',
        avg_latency: stats.count > 0 ? (stats.totalLatency / stats.count).toFixed(2) : 0,
        total_requests: stats.count
      });
    }

    // Sort by average latency in descending order
    bridgeLatencyReport.sort((a, b) => b.avg_latency - a.avg_latency);

    // Create the final JSON for this org_id
    const orgData = {
      [org_id]: {
        report_period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        },
        bridge_latency_report: bridgeLatencyReport
      }
    };

    results.push(orgData);
  }
  
  // Send data to external service
  const data = {
    "results": results,
    "time": reportType
  };
  
  const url = 'https://flow.sokt.io/func/scri4zMzbGiR';
  await fetch(url, { 
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  return results;
}

/**
 * Get all data from agent_conversations table by message_id
 * @param {string} message_id - The message ID to search for
 * @returns {Object} Data from agent_conversations table
 */
async function get_message_data(message_id) {
  try {
    // Fetch from agent_conversations table (merged data)
    const result = await models.pg.agent_conversations.findOne({
      where: { message_id },
      raw: true
    });

    if (!result) {
      return {
        message_id,
        conversation_data: null,
        raw_data: null,
        found: false
      };
    }

    // Separate the merged data back into conversation and raw_data objects for backward compatibility
    const conversationData = {};
    const rawData = {};

    // Extract conversation fields
    const conversationFields = ['id', 'bridge_id', 'user_message', 'response', 'chatbot_response', 'revised_response', 'tools_call_data', 'createdAt', 'updatedAt', 'org_id', 'user_feedback', 'thread_id', 'sub_thread_id', 'external_reference', 'version_id', 'image_urls', 'urls', 'AiConfig', 'annotations', 'fallback_model', 'type'];
    const rawDataFields = ['service', 'status', 'tokens', 'error', 'latency', 'created_at', 'authkey_name', 'variables', 'finish_reason', 'firstAttemptError', 'model_name'];

    conversationFields.forEach(field => {
      if (result.hasOwnProperty(field)) {
        conversationData[field] = result[field];
      }
    });

    rawDataFields.forEach(field => {
      if (result.hasOwnProperty(field)) {
        rawData[field] = result[field];
      }
    });

    // Add message_id to both objects
    conversationData.message_id = message_id;
    rawData.message_id = message_id;

    return {
      message_id,
      conversation_data: conversationData,
      raw_data: rawData,
      found: true
    };
  } catch (error) {
    throw new Error(`Error fetching message data: ${error.message}`);
  }
}

export { get_data_for_daily_report, get_data_from_pg, get_latency_report_data, get_message_data };
