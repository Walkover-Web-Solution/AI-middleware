import models from '../../models/index.js';
import { Op } from 'sequelize';
import configurationService from '../db_services/ConfigurationServices.js';

/**
 * Retrieves and summarizes database metrics for specified organizations from the previous month
 * @param {Array<string|number>} org_ids - Array of organization IDs to query
 * @returns {Promise<Array>} Array of organization data objects
 */
async function get_data_from_pg(org_ids) {
  // Get the start and end of the previous month
  const now = new Date();
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Process each organization in parallel for better performance
  const results = await Promise.all(org_ids.map(async (org_id) => {
    org_id = org_id.toString();
    
    // Set up date filter object once to reuse
    const dateFilter = {
      [Op.gte]: firstDayOfLastMonth,
      [Op.lte]: lastDayOfLastMonth
    };
    
    // Get raw data with aggregated stats in a single query
    const rawData = await models.pg.raw_data.findAll({
      where: {
        org_id,
        created_at: dateFilter
      },
      attributes: ['service', 'status', 'input_tokens', 'output_tokens', 'expected_cost', 'message_id', 'error']
    });
    
    // Calculate stats from raw data
    const totalHits = rawData.length;
    const totalTokensConsumed = rawData.reduce((sum, data) => 
      sum + (data.input_tokens || 0) + (data.output_tokens || 0), 0);
    const totalCost = rawData.reduce((sum, data) => sum + (data.expected_cost || 0), 0);
    const totalSuccessCount = rawData.filter(data => !data.error || data.error === '').length;
    const totalErrorCount = rawData.filter(data => data.error && data.error !== '').length;
    
    // Execute bridge stats query for top bridges
    const bridgeStatsQuery = `
      WITH bridge_stats AS (
        SELECT
          c.bridge_id,
          COUNT(c.id) AS hits,
          SUM(COALESCE(rd.input_tokens, 0) + COALESCE(rd.output_tokens, 0)) AS total_tokens_used,
          SUM(COALESCE(rd.expected_cost, 0)) AS total_cost
        FROM
          conversations c
        LEFT JOIN
          raw_data rd ON c.message_id = rd.message_id
        WHERE
          c.message_by = 'user' AND c.org_id = $1
          AND c."createdAt" >= $2
          AND c."createdAt" <= $3
          AND c.bridge_id IS NOT NULL
        GROUP BY
          c.bridge_id
      )
      SELECT
        bs.bridge_id,
        bs.hits,
        bs.total_tokens_used AS "tokens_used",
        bs.total_cost AS "cost"
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
        AND c.org_id = $1
        AND c."createdAt" >= $2
        AND c."createdAt" <= $3;
    `;

    // Use parameterized queries to prevent SQL injection
    const [bridgeStats, activeBridgesResult] = await Promise.all([
      models.pg.sequelize.query(bridgeStatsQuery, {
        type: models.pg.sequelize.QueryTypes.SELECT,
        replacements: [org_id, firstDayOfLastMonth, lastDayOfLastMonth]
      }),
      models.pg.sequelize.query(activeBridgesQuery, {
        type: models.pg.sequelize.QueryTypes.SELECT,
        replacements: [org_id, firstDayOfLastMonth, lastDayOfLastMonth]
      })
    ]);

    const activeBridges = parseInt(activeBridgesResult[0]?.active_bridges_count || 0, 10);
    
    // Fetch bridge names in parallel
    await Promise.all(bridgeStats.map(async (bridge) => {
      bridge.bridge_name = await configurationService.getBridgeNameById(bridge.bridge_id, org_id);
      return bridge;
    }));

    // Get feedback data
    const feedbackData = await models.pg.conversations.findAll({
      where: {
        org_id,
        createdAt: dateFilter,
        user_feedback: {
          [Op.ne]: null
        }
      },
      attributes: ['user_feedback']
    });

    // Calculate feedback metrics
    const feedbackMetrics = feedbackData.reduce((metrics, item) => {
      try {
        if (item.user_feedback) {
          const feedback = JSON.parse(item.user_feedback);
          metrics.dislikes += feedback.Dislikes || 0;
          metrics.positiveFeedback += feedback.PositiveFeedback || 0;
        }
      } catch (error) {
        console.error(`Error parsing feedback: ${error.message}`);
      }
      return metrics;
    }, { dislikes: 0, positiveFeedback: 0 });

    // Count new bridges created in the period
    const newBridgesQuery = `
      SELECT COUNT(DISTINCT b.id) AS new_bridges_count
      FROM bridges b
      WHERE b.org_id = $1
      AND b."createdAt" >= $2
      AND b."createdAt" <= $3;
    `;

    const newBridgesResult = await models.pg.sequelize.query(newBridgesQuery, {
      type: models.pg.sequelize.QueryTypes.SELECT,
      replacements: [org_id, firstDayOfLastMonth, lastDayOfLastMonth]
    });
    
    const newBridgesCount = parseInt(newBridgesResult[0]?.new_bridges_count || 0, 10);

    // Format the results
    return {
      [org_id]: {
        UsageOverview: {
          totalHits,
          totalTokensConsumed,
          totalCost,
          activeBridges
        },
        topBridgesTable: bridgeStats.map(bridge => ({
          bridge_id: bridge.bridge_id,
          bridge_name: bridge.bridge_name,
          hits: bridge.hits,
          tokens_used: bridge.tokens_used,
          cost: bridge.cost
        })),
        NewBridgesCreated: newBridgesCount,
        PerformanceMetrics: {
          totalSuccess: totalSuccessCount,
          totalError: totalErrorCount,
          successRate: totalHits > 0 ? (totalSuccessCount / totalHits * 100).toFixed(2) + '%' : '0%'
        },
        ClientFeedback: {
          dislike: feedbackMetrics.dislikes,
          positiveFeedback: feedbackMetrics.positiveFeedback,
          feedbackRate: totalHits > 0 ? 
            ((feedbackMetrics.dislikes + feedbackMetrics.positiveFeedback) / totalHits * 100).toFixed(2) + '%' : '0%'
        }
      }
    };
  }));

  return results;
}

export default get_data_from_pg;
