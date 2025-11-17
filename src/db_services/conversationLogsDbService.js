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

export { getConversationLogs };
