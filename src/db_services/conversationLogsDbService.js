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

/**
 * Search conversation logs with flexible filters
 * @param {string} org_id - Organization ID
 * @param {string} bridge_id - Bridge ID (required)
 * @param {Object} filters - Search filters
 * @param {string} filters.message_id - Message ID (optional)
 * @param {string} filters.keywords - Keywords to search in messages (optional)
 * @param {string} filters.thread_id - Thread ID (optional)
 * @param {string} filters.sub_thread_id - Sub Thread ID (optional)
 * @param {Object} filters.time_range - Time range filter (optional)
 * @param {string} filters.time_range.start - Start date (optional)
 * @param {string} filters.time_range.end - End date (optional)
 * @returns {Object} - Success status and nested data structure
 */
async function searchConversationLogs(org_id, bridge_id, filters) {
  try {
    // Build where conditions
    const whereConditions = {
      org_id: org_id,
      bridge_id: bridge_id
    };

    // Add optional filters
    if (filters.message_id) {
      whereConditions.message_id = filters.message_id;
    }

    if (filters.thread_id) {
      whereConditions.thread_id = filters.thread_id;
    }

    if (filters.sub_thread_id) {
      whereConditions.sub_thread_id = filters.sub_thread_id;
    }

    // Add time range filter
    if (filters.time_range) {
      const timeConditions = {};
      if (filters.time_range.start) {
        timeConditions[Sequelize.Op.gte] = new Date(filters.time_range.start);
      }
      if (filters.time_range.end) {
        timeConditions[Sequelize.Op.lte] = new Date(filters.time_range.end);
      }
      if (Object.keys(timeConditions).length > 0) {
        whereConditions.created_at = timeConditions;
      }
    }

    // Add keyword search in messages
    if (filters.keywords) {
      const keywordConditions = {
        [Sequelize.Op.or]: [
          {
            llm_message: {
              [Sequelize.Op.iLike]: `%${filters.keywords}%`
            }
          },
          {
            user: {
              [Sequelize.Op.iLike]: `%${filters.keywords}%`
            }
          },
          {
            chatbot_message: {
              [Sequelize.Op.iLike]: `%${filters.keywords}%`
            }
          },
          {
            updated_chatbot_message: {
              [Sequelize.Op.iLike]: `%${filters.keywords}%`
            }
          }
        ]
      };
      whereConditions[Sequelize.Op.and] = [keywordConditions];
    }

    // Get all matching logs
    const logs = await models.pg.conversation_logs.findAll({
      where: whereConditions,
      order: [['created_at', 'ASC']]
    });

    // Group data by thread_id and sub_thread_id
    const groupedData = {};

    logs.forEach(log => {
      const threadId = log.thread_id;
      const subThreadId = log.sub_thread_id;
      const bridgeId = log.bridge_id;

      // Initialize thread if not exists
      if (!groupedData[threadId]) {
        groupedData[threadId] = {
          thread_id: threadId,
          sub_thread: {}
        };
      }

      // Initialize sub_thread if not exists
      if (!groupedData[threadId].sub_thread[subThreadId]) {
        groupedData[threadId].sub_thread[subThreadId] = {
          sub_thread_id: subThreadId,
          display_name: "Creating a brief summary.", // Default display name
          messages: []
        };
      }

      // Add message to sub_thread
      const message = log.user || log.llm_message || log.chatbot_message || log.updated_chatbot_message || "";
      if (message) {
        groupedData[threadId].sub_thread[subThreadId].messages.push({
          message: message,
          message_id: log.message_id
        });
      }
    });

    // Convert grouped data to array format
    const result = Object.values(groupedData).map(thread => ({
      ...thread,
      sub_thread: Object.values(thread.sub_thread)
    }));

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("Error searching conversation logs:", error);
    return {
      success: false,
      message: "Failed to search conversation logs",
      error: error.message
    };
  }
}

export { getConversationLogs, getRecentThreads, searchConversationLogs };
