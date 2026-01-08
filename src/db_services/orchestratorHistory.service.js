import models from "../../models/index.js";
import Sequelize from "sequelize";


/**
 * Get orchestrator conversation logs with pagination and filtering
 * @param {string} org_id - Organization ID
 * @param {string} agent_id - Agent ID (used in bridge_id JSON field)
 * @param {string} thread_id - Thread ID
 * @param {string} sub_thread_id - Sub Thread ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 30)
 * @returns {Object} - Success status and data
 */
async function findOrchestratorConversationLogsByIds(org_id, agent_id, thread_id, sub_thread_id, page = 1, limit = 30) {
  try {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = {
      org_id: org_id,
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

    // Reverse the conversation logs array to get chronological order
    const reversedLogs = logs.reverse();

    return {
      success: true,
      data: reversedLogs
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
 * Get recent threads from orchestrator_conversation_logs by agent_id (in bridge_id), ordered by updated_at
 * @param {string} org_id - Organization ID
 * @param {string} agent_id - Agent ID (searches within bridge_id JSON)
 * @param {Object} filters - Search filters
 * @param {string} filters.keyword - Keyword to search (optional)
 * @param {Object} filters.time_range - Time range filter (optional)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 30)
 * @returns {Object} - Success status and data
 */
async function findRecentOrchestratorThreads(org_id, agent_id, filters, page = 1, limit = 30) {
  try {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = {
      org_id: org_id,
      [Sequelize.Op.and]: [
        Sequelize.literal(`bridge_id ? '${agent_id}'`)
      ]
    };

    // Add time range filter
    if (filters?.time_range) {
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
    // Since most fields are JSON, we'll search in thread_id, sub_thread_id
    if (filters?.keyword?.length > 0 && filters?.keyword !== "") {
      const keywordConditions = {
        [Sequelize.Op.or]: [
          { thread_id: { [Sequelize.Op.iLike]: `%${filters.keyword}%` } },
          { sub_thread_id: { [Sequelize.Op.iLike]: `%${filters.keyword}%` } }
        ]
      };
      whereConditions[Sequelize.Op.and] = [keywordConditions];
    }

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

    // If keyword search is active, fetch matching messages for the found threads
    if (filters?.keyword && formattedThreads?.length > 0) {
      const threadIds = formattedThreads.map(t => t.thread_id);

      const messagesWhere = {
        ...whereConditions,
        thread_id: { [Sequelize.Op.in]: threadIds }
      };

      const matchedMessages = await models.pg.orchestrator_conversation_logs.findAll({
        where: messagesWhere,
        order: [['created_at', 'DESC']]
      });

      // Attach matching messages to threads
      formattedThreads.forEach(thread => {
        const threadMessages = matchedMessages.filter(m => m.thread_id === thread.thread_id);

        thread.message = threadMessages.map(msg => ({
          message_id: msg.message_id,
          created_at: msg.created_at
        }));

        const distinctSubThreads = [...new Set(threadMessages.map(m => m.sub_thread_id).filter(Boolean))];
        if (distinctSubThreads.length > 0) {
          thread.sub_thread = distinctSubThreads.map(stId => ({
            sub_thread_id: stId,
            display_name: stId,
            messages: threadMessages.filter(m => m.sub_thread_id === stId).map(msg => ({
              message_id: msg.message_id,
              created_at: msg.created_at
            }))
          }));
        }
      });
    }

    return {
      success: true,
      data: formattedThreads
    };
  } catch (error) {
    console.error("Error fetching recent orchestrator threads:", error);
    return {
      success: false,
      message: "Failed to fetch recent orchestrator threads",
      error: error.message
    };
  }
}

/**
 * Get orchestrator thread history with formatted data
 * @param {string} org_id - Organization ID
 * @param {string} thread_id - Thread ID
 * @param {string} sub_thread_id - Sub Thread ID (optional, defaults to thread_id)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 30)
 * @returns {Object} - Success status, formatted data with pagination
 */
async function findOrchestratorThreadHistoryFormatted(org_id, thread_id, sub_thread_id, page = 1, limit = 30) {
  try {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = {
      org_id: org_id,
      thread_id: thread_id,
      sub_thread_id: sub_thread_id ? sub_thread_id : thread_id
    };

    // Get total count
    const totalCount = await models.pg.orchestrator_conversation_logs.count({
      where: whereConditions
    });

    // Get paginated data
    const logs = await models.pg.orchestrator_conversation_logs.findAll({
      where: whereConditions,
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset
    });

    // Reverse to get chronological order
    const reversedLogs = logs.reverse();

    // Format data
    const formattedData = reversedLogs.map(log => ({
      id: log.id,
      llm_message: log.llm_message,
      user: log.user,
      chatbot_message: log.chatbot_message,
      updated_llm_message: log.updated_llm_message,
      prompt: log.prompt,
      error: log.error,
      tools_call_data: log.tools_call_data,
      message_id: log.message_id,
      sub_thread_id: log.sub_thread_id,
      thread_id: log.thread_id,
      version_id: log.version_id,
      bridge_id: log.bridge_id,
      image_urls: log.image_urls,
      urls: log.urls,
      AiConfig: log.AiConfig,
      fallback_model: log.fallback_model,
      model: log.model,
      status: log.status,
      tokens: log.tokens,
      variables: log.variables,
      latency: log.latency,
      firstAttemptError: log.firstAttemptError,
      finish_reason: log.finish_reason,
      agents_path: log.agents_path,
      created_at: log.created_at,
      updated_at: log.updated_at
    }));

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      data: formattedData,
      totalPages: totalPages,
      totalEntries: totalCount
    };
  } catch (error) {
    console.error("Error fetching orchestrator thread history:", error);
    return {
      success: false,
      message: "Failed to fetch orchestrator thread history",
      error: error.message
    };
  }
}

export { 
  findOrchestratorConversationLogsByIds, 
  findRecentOrchestratorThreads,
  findOrchestratorThreadHistoryFormatted
};

