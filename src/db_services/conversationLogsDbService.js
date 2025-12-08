import models from "../../models/index.js";
import Sequelize from "sequelize";
const { fn, col } = models.pg.sequelize;


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
async function getConversationLogs(org_id, bridge_id, thread_id, sub_thread_id, page = 1, limit = 30, version_id = null) {
  try {
    const offset = (page - 1) * limit;

    // Build where conditions - all parameters are required
    const whereConditions = {
      org_id: org_id,
      bridge_id: bridge_id,
      thread_id: thread_id,
      sub_thread_id: sub_thread_id
    };

    if (version_id) {
      whereConditions.version_id = version_id;
    }

    // Get paginated data
    const logs = await models.pg.conversation_logs.findAll({
      where: whereConditions,
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset
    });

    // Reverse the conversation logs array
    const reversedLogs = logs.reverse();

    return {
      success: true,
      data: reversedLogs
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
 * @param {Object} filters - Search filters
 * @param {string} filters.keyword - Keyword to search (optional)
 * @param {Object} filters.time_range - Time range filter (optional)
 * @param {string} user_feedback - Filter by user feedback
 * @param {string} error - Filter by error
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 30)
 * @returns {Object} - Success status and data
 */
async function getRecentThreads(org_id, bridge_id, filters, user_feedback, error, page = 1, limit = 30, version_id = null) {
  try {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = {
      org_id: org_id,
      bridge_id: bridge_id
    };

    if (user_feedback !== 'all' && user_feedback !== 'undefined') {
      whereConditions.user_feedback = user_feedback === "all" ? 0 : user_feedback;
    }

    if (error !== 'false') {
      whereConditions.error = error;
    }

    if (version_id) {
      whereConditions.version_id = version_id;
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
      if (timeConditions) {
        whereConditions.created_at = timeConditions;
      }
    }

    // Add keyword search across recommended columns
    if (filters?.keyword?.length > 0 && filters?.keyword !== "") {
      const keywordConditions = {
        [Sequelize.Op.or]: [
          { message_id: { [Sequelize.Op.iLike]: `%${filters.keyword}%` } },
          { thread_id: { [Sequelize.Op.iLike]: `%${filters.keyword}%` } },
          { sub_thread_id: { [Sequelize.Op.iLike]: `%${filters.keyword}%` } },
          { llm_message: { [Sequelize.Op.iLike]: `%${filters.keyword}%` } },
          { user: { [Sequelize.Op.iLike]: `%${filters.keyword}%` } },
          { chatbot_message: { [Sequelize.Op.iLike]: `%${filters.keyword}%` } },
          { updated_llm_message: { [Sequelize.Op.iLike]: `%${filters.keyword}%` } }
        ]
      };
      whereConditions[Sequelize.Op.and] = [keywordConditions];
    }

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

    // If keyword search is active, fetch matching messages for the found threads
    if (filters?.keyword && formattedThreads?.length > 0) {
      const threadIds = formattedThreads.map(t => t.thread_id);

      const messagesWhere = {
        ...whereConditions,
        thread_id: { [Sequelize.Op.in]: threadIds }
      };

      const matchedMessages = await models.pg.conversation_logs.findAll({
        where: messagesWhere,
        order: [['created_at', 'DESC']]
      });

      // Attach matching messages to threads
      formattedThreads.forEach(thread => {
        const threadMessages = matchedMessages.filter(m => m.thread_id === thread.thread_id);

        thread.message = threadMessages.map(msg => {
          // Determine the content to display
          let content = '';
          if (msg.user && msg.user.toLowerCase().includes(filters.keyword.toLowerCase())) {
            content = msg.user;
          } else if ((msg.llm_message || '').toLowerCase().includes(filters.keyword.toLowerCase())) {
            content = msg.llm_message;
          } else if ((msg.chatbot_message || '').toLowerCase().includes(filters.keyword.toLowerCase())) {
            content = msg.chatbot_message;
          } else if ((msg.updated_llm_message || '').toLowerCase().includes(filters.keyword.toLowerCase())) {
            content = msg.updated_llm_message;
          } else {
            // Fallback if match query matched ID or something else
            content = msg.user || msg.llm_message || msg.chatbot_message || "Match found in ID or metadata";
          }

          return {
            message_id: msg.message_id,
            message: content,
            created_at: msg.created_at
          };
        });

        const distinctSubThreads = [...new Set(threadMessages.map(m => m.sub_thread_id).filter(Boolean))];
        if (distinctSubThreads.length > 0) {
          thread.sub_thread = distinctSubThreads.map(stId => ({
            sub_thread_id: stId,
            display_name: stId,
            messages: threadMessages.filter(m => m.sub_thread_id === stId).map(msg => ({
              message_id: msg.message_id,
              message: msg.user || msg.llm_message || "Match found" // Simplify for subthread view
            }))
          }));
        }
      });
    }

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
 * Get thread history with formatted user/assistant messages
 * @param {string} org_id - Organization ID
 * @param {string} thread_id - Thread ID
 * @param {string} bridge_id - Bridge ID
 * @param {string} sub_thread_id - Sub Thread ID (optional, defaults to thread_id)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 30)
 * @returns {Object} - Success status, formatted data with pagination
 */
async function getThreadHistoryFormatted(org_id, thread_id, bridge_id, sub_thread_id, page = 1, limit = 30, version_id = null) {
  try {
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = {
      org_id: org_id,
      thread_id: thread_id,
      bridge_id: bridge_id,
      sub_thread_id: sub_thread_id ? sub_thread_id : thread_id
    };

    if (version_id) {
      whereConditions.version_id = version_id;
    }

    // Get total count
    const totalCount = await models.pg.conversation_logs.count({
      where: whereConditions
    });

    // Get paginated data
    const logs = await models.pg.conversation_logs.findAll({
      where: whereConditions,
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset
    });

    // Reverse to get chronological order
    const reversedLogs = logs.reverse();

    // Format data: split each entry into user and assistant messages
    const formattedData = [];

    reversedLogs.forEach(log => {
      // Create user message entry
      if (log.user) {
        formattedData.push({
          Id: log.id,
          content: log.user,
          role: "user",
          createdAt: log.created_at,
          chatbot_message: null,
          tools_call_data: null,
          user_feedback: null,
          sub_thread_id: log.sub_thread_id,
          image_urls: [] || null,
          urls: log.user_urls || null,
          message_id: log.message_id,
          error: log.error || ""
        });
      }

      // Create assistant message entry
      const assistantContent = log.updated_llm_message || log.llm_message || log.chatbot_message || "";
      if (assistantContent) {
        formattedData.push({
          Id: log.id + "_llm",
          content: assistantContent,
          role: "assistant",
          createdAt: log.created_at,
          chatbot_message: log.chatbot_message || "",
          tools_call_data: log.tools_call_data || null,
          user_feedback: log.user_feedback || null,
          sub_thread_id: log.sub_thread_id,
          image_urls: log.llm_urls || null,
          urls: null,
          message_id: log.message_id + "_llm",
          fallback_model: typeof log.fallback_model === 'object' ? JSON.stringify(log.fallback_model) : (log.fallback_model || ""),
          error: ""
        });
      }
    });

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      data: formattedData,
      totalPages: totalPages,
      totalEnteries: totalCount,
      starterQuestion: []
    };
  } catch (error) {
    console.error("Error fetching thread history:", error);
    return {
      success: false,
      message: "Failed to fetch thread history",
      error: error.message
    };
  }
}

const getHistoryByMessageId = async (message_id) => {
  const result = await models.pg.conversation_logs.findOne({
    where: { message_id },
  });
  return result;
}


const getSubThreads = async (org_id, thread_id, bridge_id) => {
  return await models.pg.conversation_logs.findAll({ where: { org_id, thread_id, bridge_id } });
}



async function getSubThreadsByError(org_id, thread_id, bridge_id, version_id, isError) {
  try {
    let rawDataWhereClause = {};
    let conversationsWhereClause = {
      org_id,
      thread_id,
      bridge_id
    };

    // Apply version_id filter to the conversations table
    if (version_id) {
      conversationsWhereClause.version_id = version_id;
    }

    if (isError) {
      rawDataWhereClause.error = {
        [models.pg.Sequelize.Op.ne]: ''
      };
    }

    const result = await models.pg.conversation_logs.findAll({
      attributes: [
        'sub_thread_id',
        'version_id',
        [models.pg.Sequelize.fn('MAX', 'created_at'), 'latest_error']
      ],
      where: conversationsWhereClause,
      group: ['sub_thread_id', 'version_id'],
      order: [[models.pg.Sequelize.literal('latest_error'), 'DESC']],
      raw: true
    });

    return result.map(item => item.sub_thread_id);
  } catch (error) {
    console.error('getSubThreadsByError error =>', error);
    return [];
  }
}

async function sortThreadsByHits(threads) {
  const subThreadIds = [...new Set(threads.map(t => t.sub_thread_id).filter(Boolean))];

  const latestEntries = await models.pg.conversation_logs.findAll({
    attributes: [
      'sub_thread_id',
      [fn('MAX', col('created_at')), 'latestCreatedAt']
    ],
    where: { sub_thread_id: subThreadIds },
    group: ['sub_thread_id'],
    raw: true
  });

  let latestSubThreadMap = {}
  latestEntries.map(entry => {
    latestSubThreadMap[entry.sub_thread_id] = new Date(entry.latestCreatedAt)
  })

  // threads.sort((a, b) => {
  //   const dateA = latestSubThreadMap.get(a.sub_thread_id) || new Date(0);
  //   const dateB = latestSubThreadMap.get(b.sub_thread_id) || new Date(0);
  //   return dateB - dateA;
  // });

  const finalArray = [];

  for (let i = 0; i < threads.length; i++) {
    const item = threads[i];
    const created_at = latestSubThreadMap[item.sub_thread_id]

    finalArray.push({
      id: item.id || item._id || null,
      thread_id: item.thread_id || null,
      sub_thread_id: item.sub_thread_id || null,
      bridge_id: item.bridge_id || null,
      org_id: item.org_id || null,
      created_at: created_at,
      display_name: item.display_name || null
    });
  }


  return finalArray;
}

async function updateStatus({ status, message_id }) {
    const [affectedCount, affectedRows] = await models.pg.conversation_logs.update(
      { user_feedback : status },
      {
        where: {
          message_id
        },
        returning: true,
      }
    );
    if (affectedCount === 0) {
      return { success: true, message: 'No matching record found to update.' };
    }

    return { success: true, result: affectedRows };
}

export { sortThreadsByHits, getSubThreadsByError, getSubThreads, getConversationLogs, getRecentThreads, getThreadHistoryFormatted, getHistoryByMessageId, updateStatus };
