import models from "../../models/index.js";
import Sequelize from "sequelize";

/**
 * Get conversation logs with pagination and filtering
 * @param {string} org_id - Organization ID
 * @param {string} bridge_id - Bridge ID
 * @param {string} thread_id - Thread ID
 * @param {string} sub_thread_id - Sub Thread ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 30)
 * @returns {Object} - Success status and data
 */
async function getConversationLogs(org_id, bridge_id, thread_id, sub_thread_id, page = 1, limit = 30) {
  try {
    const offset = (page - 1) * limit;
    
    // Build where conditions - all parameters are required
    const whereConditions = {
      org_id: org_id,
      bridge_id: bridge_id,
      thread_id: thread_id,
      sub_thread_id: sub_thread_id
    };

    // Get paginated data
    const logs = await models.pg.conversation_logs.findAll({
      where: whereConditions,
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    return {
      success: true,
      data: logs
    };
  } catch (error) {
    console.error("Error fetching conversation logs:", error);
    return {
      success: false,
      message: "Failed to fetch conversation logs",
      error: error.message
    };
  }
}

/**
 * Get recent threads by bridge_id, ordered by updated_at
 * @param {string} org_id - Organization ID
 * @param {string} bridge_id - Bridge ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 30)
 * @returns {Object} - Success status and data
 */
async function getRecentThreads(org_id, bridge_id, page = 1, limit = 30) {
  try {
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const whereConditions = {
      org_id: org_id,
      bridge_id: bridge_id
    };

    // Get recent threads with distinct thread_id, ordered by updated_at
    const threads = await models.pg.conversation_logs.findAll({
      attributes: [
        'thread_id',
        [Sequelize.fn('MAX', Sequelize.col('id')), 'id'],
        [Sequelize.fn('MAX', Sequelize.col('updated_at')), 'updated_at']
      ],
      where: whereConditions,
      group: ['thread_id'],
      order: [[Sequelize.fn('MAX', Sequelize.col('updated_at')), 'DESC']],
      limit: limit,
      offset: offset
    });

    // Format the response - simple thread data only
    const formattedThreads = threads.map(thread => ({
      id: thread.dataValues.id,
      thread_id: thread.dataValues.thread_id,
      updated_at: thread.dataValues.updated_at
    }));

    // Get total count of all user_feedback values across all threads
    const totalFeedbackCount = await models.pg.conversation_logs.findOne({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN user_feedback = 0 THEN 1 END")), 'total_feedback_0'],
        [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN user_feedback = 1 THEN 1 END")), 'total_feedback_1'],
        [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN user_feedback = 2 THEN 1 END")), 'total_feedback_2']
      ],
      where: whereConditions
    });
    
    return {
      success: true,
      data: formattedThreads,
      total_user_feedback_count: {
        "0": parseInt(totalFeedbackCount.dataValues.total_feedback_0) || 0,
        "1": parseInt(totalFeedbackCount.dataValues.total_feedback_1) || 0,
        "2": parseInt(totalFeedbackCount.dataValues.total_feedback_2) || 0
      }
    };
  } catch (error) {
    console.error("Error fetching recent threads:", error);
    return {
      success: false,
      message: "Failed to fetch recent threads",
      error: error.message
    };
  }
}

export { getConversationLogs, getRecentThreads };
