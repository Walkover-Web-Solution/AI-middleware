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
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 30)
 * @returns {Object} - Success status and data
 */
async function getRecentThreads(org_id, bridge_id, user_feedback, error, page = 1, limit = 30) {
  try {
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const whereConditions = {
      org_id: org_id,
      bridge_id: bridge_id
    };

    if (user_feedback !== 'all' || user_feedback !== 'undefined') {
      whereConditions.user_feedback = user_feedback === "all" ?  0 : user_feedback;
    }

    if (error !== 'false') {
      whereConditions.error = error;
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
 * @param {string} filters.keyword - Keyword to search across recommended columns (required)
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
    if (filters.keyword) {
      const keywordConditions = {
        [Sequelize.Op.or]: [
          {
            message_id: {
              [Sequelize.Op.iLike]: `%${filters.keyword}%`
            }
          },
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
          {
            llm_message: {
              [Sequelize.Op.iLike]: `%${filters.keyword}%`
            }
          },
          {
            user: {
              [Sequelize.Op.iLike]: `%${filters.keyword}%`
            }
          },
          {
            chatbot_message: {
              [Sequelize.Op.iLike]: `%${filters.keyword}%`
            }
          },
          {
            updated_llm_message: {
              [Sequelize.Op.iLike]: `%${filters.keyword}%`
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
    console.error("Error searching conversation logs:", error);
    return {
      success: false,
      message: "Failed to search conversation logs",
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
async function getThreadHistoryFormatted(org_id, thread_id, bridge_id, sub_thread_id, page = 1, limit = 30) {
  try {
    const offset = (page - 1) * limit;
    
    // Build where conditions
    const whereConditions = {
      org_id: org_id,
      thread_id: thread_id,
      bridge_id: bridge_id,
      sub_thread_id: sub_thread_id ? sub_thread_id : thread_id
    };

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


const getSubThreads = async (org_id,thread_id, bridge_id) =>{
    return await models.pg.conversation_logs.findAll({where:{ org_id, thread_id, bridge_id }});
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
    
    if(isError) {
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
      latestSubThreadMap[entry.sub_thread_id]= new Date(entry.latestCreatedAt)
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

/**
 * Create a new conversation log entry
 * @param {Object} payload - The conversation log data
 * @returns {Object} - The created conversation log
 */
async function createConversationLog(payload) {
  try {
    // Transform the payload from old format to new format if needed
    const transformedPayload = {
      org_id: payload.org_id,
      thread_id: payload.thread_id,
      sub_thread_id: payload.sub_thread_id || payload.thread_id,
      bridge_id: payload.bridge_id,
      version_id: payload.version_id || null,
      message_id: payload.message_id,
      model: payload.model_name || null,
      status: payload.status || false,
      user_feedback: payload.user_feedback || 0,
      tools_call_data: payload.tools_call_data || [],
      user_urls: payload.user_urls || [],
      llm_urls: payload.llm_urls || [],
      AiConfig: payload.AiConfig || null,
      fallback_model: payload.fallback_model || null,
      tokens: payload.tokens || null,
      variables: payload.variables || null,
      latency: payload.latency || null,
      error: payload.error || null,
      firstAttemptError: payload.firstAttemptError || null,
      finish_reason: payload.finish_reason || null,
      parent_id: payload.parent_id || null,
      child_id: payload.child_id || null
    };

    // Handle message fields based on message_by or type
    if (payload.message_by === 'user' || payload.type === 'user') {
      transformedPayload.user = payload.message || null;
    } else if (payload.message_by === 'assistant' || payload.type === 'assistant') {
      transformedPayload.llm_message = payload.message || null;
      transformedPayload.chatbot_message = payload.chatbot_message || payload.message || null;
      transformedPayload.updated_llm_message = payload.updated_message || null;
    } else if (payload.message_by === 'tools_call' || payload.type === 'tools_call') {
      transformedPayload.tools_call_data = payload.tools_call_data || payload.function || [];
    } else {
      // Default: if message_by is 'assistant' or not specified, treat as assistant
      transformedPayload.chatbot_message = payload.message || null;
    }

    transformedPayload.prompt = payload.prompt || null;
    transformedPayload.service = payload.service || null;

    const result = await models.pg.conversation_logs.create(transformedPayload);
    return result;
  } catch (error) {
    console.error("Error creating conversation log:", error);
    throw error;
  }
}

export { sortThreadsByHits, updateStatus, getSubThreadsByError, getSubThreads, getConversationLogs, getRecentThreads, searchConversationLogs, getThreadHistoryFormatted, getHistoryByMessageId, createConversationLog };
