import models from "../../models/index.js";
import Sequelize from "sequelize";

/**
 * Get orchestrator conversation logs with pagination and filtering
 * @param {string} org_id - Organization ID
 * @param {string} bridge_id - Bridge ID
 * @param {string} thread_id - Thread ID
 * @param {string} sub_thread_id - Sub Thread ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 30)
 * @returns {Object} - Success status and data
 */
async function getOrchestratorConversationLogs(org_id, bridge_id, thread_id, sub_thread_id, page = 1, limit = 30) {
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
    const logs = await models.pg.orchestrator_conversation_logs.findAll({
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
    console.error("Error fetching orchestrator conversation logs:", error);
    return {
      success: false,
      message: "Failed to fetch orchestrator conversation logs",
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
async function getOrchestratorRecentThreads(org_id, bridge_id, page = 1, limit = 30) {
  try {
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const whereConditions = {
      org_id: org_id,
      bridge_id: bridge_id
    };

    // Get recent threads with distinct thread_id, ordered by updated_at
    const threads = await models.pg.orchestrator_conversation_logs.findAll({
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
    
    return {
      success: true,
      data: formattedThreads
    };
  } catch (error) {
    console.error("Error fetching orchestrator recent threads:", error);
    return {
      success: false,
      message: "Failed to fetch orchestrator recent threads",
      error: error.message
    };
  }
}

/**
 * Search orchestrator conversation logs with flexible filters
 * @param {string} org_id - Organization ID
 * @param {string} bridge_id - Bridge ID (required)
 * @param {Object} filters - Search filters
 * @param {string} filters.keyword - Keyword to search across recommended columns (required)
 * @param {Object} filters.time_range - Time range filter (optional)
 * @param {string} filters.time_range.start - Start date (optional)
 * @param {string} filters.time_range.end - End date (optional)
 * @returns {Object} - Success status and nested data structure
 */
async function searchOrchestratorConversationLogs(org_id, bridge_id, filters) {
  try {
    // Build where conditions
    const whereConditions = {
      org_id: org_id,
      bridge_id: bridge_id
    };

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

    // Add keyword search across recommended columns
    // Note: Since many fields are JSONB, we'll search them as JSONB using JSONB operators
    if (filters.keyword) {
      const keywordConditions = {
        [Sequelize.Op.or]: [
          {
            thread_id: {
              [Sequelize.Op.iLike]: `%${filters.keyword}%`
            }
          },
          {
            sub_thread_id: {
              [Sequelize.Op.iLike]: `%${filters.keyword}%`
            }
          },
          // For JSONB fields, cast to text and search
          Sequelize.where(Sequelize.cast(Sequelize.col('llm_message'), 'TEXT'), {
            [Sequelize.Op.iLike]: `%${filters.keyword}%`
          }),
          Sequelize.where(Sequelize.cast(Sequelize.col('user'), 'TEXT'), {
            [Sequelize.Op.iLike]: `%${filters.keyword}%`
          }),
          Sequelize.where(Sequelize.cast(Sequelize.col('chatbot_message'), 'TEXT'), {
            [Sequelize.Op.iLike]: `%${filters.keyword}%`
          }),
          Sequelize.where(Sequelize.cast(Sequelize.col('updated_llm_message'), 'TEXT'), {
            [Sequelize.Op.iLike]: `%${filters.keyword}%`
          }),
          Sequelize.where(Sequelize.cast(Sequelize.col('message_id'), 'TEXT'), {
            [Sequelize.Op.iLike]: `%${filters.keyword}%`
          })
        ]
      };
      whereConditions[Sequelize.Op.and] = [keywordConditions];
    }

    // Get all matching logs
    const logs = await models.pg.orchestrator_conversation_logs.findAll({
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
          messages: []
        };
      }

      // Add message to sub_thread
      const message = log.user || log.llm_message || log.chatbot_message || log.updated_llm_message || "";
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
    console.error("Error searching orchestrator conversation logs:", error);
    return {
      success: false,
      message: "Failed to search orchestrator conversation logs",
      error: error.message
    };
  }
}

export { getOrchestratorConversationLogs, getOrchestratorRecentThreads, searchOrchestratorConversationLogs };

