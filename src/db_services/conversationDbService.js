import models from "../../models/index.js";
import Sequelize from "sequelize";
import Thread from "../mongoModel/threadModel.js";

async function getHistory(bridge_id, timestamp) {
  try {
    const history = await models.pg.system_prompt_versionings.findAll({
      where: {
        bridge_id,
        updated_at: {
          [Sequelize.Op.lte]: timestamp
        }
      },
      order: [
        ['updated_at', 'DESC'],
      ],
      limit: 1
    });

    return { success: true, system_prompt: history[0].system_prompt };
  } catch (error) {
    console.error("get history system prompt error=>", error)
    return { success: false, message: "Prompt not found" };
  }
}


async function findMessage(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize, user_feedback, version_id, isChatbot, error) {
  const offset = page && pageSize ? (page - 1) * pageSize : null;
  const limit = pageSize || null;
  
  // Build the WHERE clause for the SQL query
  let whereConditions = [
    `conversations.org_id = '${org_id}'`,
    `thread_id = '${thread_id}'`,
    `bridge_id = '${bridge_id}'`,
    `sub_thread_id = '${sub_thread_id}'`
  ];
  
  if (version_id !== undefined && version_id) {
    whereConditions.push(`version_id = '${version_id}'`);
  }
  
  if (user_feedback === "all" || !user_feedback) {
    whereConditions.push(`(user_feedback IS NULL OR user_feedback IN (0, 1, 2))`);
  } else {
    whereConditions.push(`user_feedback = ${user_feedback}`);
  }

  // Add condition for error if error is true
  if (error) {
    whereConditions.push(`raw_data.error != ''`);
  }
  
  const whereClause = whereConditions.join(' AND ');
  
  let countResult = [{ total: 0 }];
  // Only execute count query if not chatbot
  if (!isChatbot) {
    const countQuery = `
      SELECT COUNT(*) as total
      FROM conversations
      LEFT JOIN raw_data ON conversations.message_id = raw_data.message_id
      WHERE conversations.org_id = '${org_id}'
        AND thread_id = '${thread_id}'
        AND bridge_id = '${bridge_id}'
        AND sub_thread_id = '${sub_thread_id}'
        AND raw_data.error != ''
    `;
    [countResult] = await models.pg.sequelize.query(countQuery, { type: models.pg.sequelize.QueryTypes.SELECT });
  }
  
  // Main query with JOIN to raw_data
  let query = `
    SELECT 
      conversations.message as content,
      conversations.message_by as role,
      conversations."createdAt",
      conversations.id as "Id",
      conversations.function,
      conversations.is_reset,
      conversations.chatbot_message,
      conversations.updated_message,
      conversations.tools_call_data,
      conversations.message_id,
      conversations.user_feedback,
      conversations.sub_thread_id,
      conversations.version_id,
      conversations.image_url,
      conversations.urls,
      conversations."AiConfig",
      conversations.annotations,
      raw_data.*
    FROM conversations
    LEFT JOIN raw_data ON conversations.message_id = raw_data.message_id
    WHERE ${whereClause}
    ORDER BY conversations.id DESC
  `;
  
  // Add pagination if needed
  if (limit !== null) {
    query += ` LIMIT ${limit}`;
  }
  
  if (offset !== null) {
    query += ` OFFSET ${offset}`;
  }
  
  // Execute main query
  const conversationsResult = await models.pg.sequelize.query(query, { type: models.pg.sequelize.QueryTypes.SELECT });
  
  // Get total entries from count query
  const totalEntries = parseInt(countResult?.total || 0);
  
  // Sort the results in ascending order (since we queried in DESC but need to reverse)
  const conversations = conversationsResult.reverse();
  
  // Calculate pagination info only if not chatbot
  const totalPages = isChatbot ? 1 : (limit ? Math.ceil(totalEntries / limit) : 1);
  
  return { conversations, totalPages, totalEntries: isChatbot ? conversations.length : totalEntries };
}

async function deleteLastThread(org_id, thread_id, bridge_id) {
  const recordsTodelete = await models.pg.conversations.findOne({
    where: {
      org_id,
      thread_id,
      bridge_id,
      message_by: "tool_calls"
    },
    order: [['id', 'DESC']]
  });
  if (recordsTodelete) {
    await recordsTodelete.destroy();
    return {
      success: true
    };
  }
  return {
    success: false
  };
}
// Find All conversation db Service
async function findAllThreads(bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search, user_feedback = null, error = false) {
  // Build the base WHERE clause
  let whereClause = {
    'conversations.bridge_id': bridge_id,
    'conversations.org_id': org_id,
  };

  // If user_feedback is provided and is not 'all', include it in the WHERE clause
  if (user_feedback && user_feedback !== "all") {
    whereClause['conversations.user_feedback'] = user_feedback;
  }

  // If there is a date range, add it to the WHERE clause
  if (startTimestamp && endTimestamp) {
    whereClause['conversations.updatedAt'] = {
      [Sequelize.Op.between]: [new Date(startTimestamp), new Date(endTimestamp)],
    };
  }

  // Create the raw SQL query
  let query = `
    SELECT 
      conversations."thread_id", 
      MIN(conversations.id) AS "id", 
      conversations."bridge_id", 
      MAX(conversations."updatedAt") AS "updatedAt" 
    FROM 
      conversations 
    LEFT JOIN 
      raw_data 
      ON conversations.message_id = raw_data.message_id 
    WHERE 
      conversations."bridge_id" = :bridge_id 
      AND conversations."org_id" = :org_id 
  `;

  // Dynamically adding filters to the WHERE clause
  if (startTimestamp && endTimestamp) {
    query += `AND conversations."updatedAt" BETWEEN :startTimestamp AND :endTimestamp `;
  }

  if (keyword_search) {
    query += `AND (conversations.message LIKE :keyword_search OR raw_data.message LIKE :keyword_search) `;
  }

  if (user_feedback && user_feedback !== "all") {
    query += `AND conversations."user_feedback" = :user_feedback `;
  }

  if (error){
    query += `AND raw_data.error != '' `;
  }

  // Add GROUP BY, ORDER BY, LIMIT, and OFFSET
  query += `
    GROUP BY 
      conversations."thread_id", 
      conversations."bridge_id" 
    ORDER BY 
      MAX(conversations."updatedAt") DESC, 
      conversations."thread_id" ASC 
    LIMIT :limit OFFSET :offset;
  `;

  // Define query parameters
  const queryParams = {
    bridge_id,
    org_id,
    limit,
    offset: (pageNo - 1) * limit,
    keyword_search: keyword_search ? `%${keyword_search}%` : undefined,
    startTimestamp: startTimestamp ? new Date(startTimestamp) : undefined,
    endTimestamp: endTimestamp ? new Date(endTimestamp) : undefined,
    user_feedback: user_feedback || undefined,
  };

  // Execute the raw SQL query using Sequelize
  const threads = await models.pg.sequelize.query(query, {
    replacements: queryParams,
    type: Sequelize.QueryTypes.SELECT,
  });

  // Map the raw query result into the desired format
  const uniqueThreads = new Map();

  threads.forEach(thread => {
    const uniqueKey = `${thread.bridge_id}-${thread.thread_id}`;

    // Create the response object
    const response = {
      thread_id: thread.thread_id,
      id: thread.id,
      bridge_id: thread.bridge_id,
      updatedAt: thread.updatedAt,
    };

    // Only store unique thread entries
    if (!uniqueThreads.has(uniqueKey)) {
      uniqueThreads.set(uniqueKey, response);
    }
  });

  // Convert the Map values to an array and return the result
  return Array.from(uniqueThreads.values());
}





async function storeSystemPrompt(promptText, orgId, bridgeId) {
  try {
    await models.pg.system_prompt_versionings.create({
      system_prompt: promptText,
      org_id: orgId,
      bridge_id: bridgeId,
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Error storing system prompt:', error);
  }
}

async function findThreadsForFineTune(org_id, thread_id, bridge_id, user_feedback_array) {
  let whereClause = {
    org_id,
    thread_id,
    bridge_id
  };

  if (user_feedback_array.includes(0)) {
    // If 0 is included, we want all data, so no need to filter by user_feedback
  } else {
    whereClause.user_feedback = {
      [Sequelize.Op.in]: user_feedback_array
    };
  }

  let conversations = await models.pg.conversations.findAll({
    attributes: [
      ['message', 'content'],
      ['message_by', 'role'],
      'createdAt',
      'id',
      'function',
      'updated_message',
      [Sequelize.col('raw_data.error'), 'error']
    ],
    include: [{
      model: models.pg.raw_data,
      as: 'raw_data',
      attributes: [],
      required: false,
      where: {
        [Sequelize.Op.or]: [
          { error: '' },
          { error: { [Sequelize.Op.is]: null } }
        ]
      }
    }],
    where: whereClause,
    order: [['id', 'DESC']],
    raw: true
  });

  conversations = conversations.reverse();
  return conversations;
}

async function system_prompt_data(org_id, bridge_id)
{
  const system_prompt = await models.pg.system_prompt_versionings.findOne({
    where: {
      org_id,
      bridge_id
    },
    order: [
      ['updated_at', 'DESC'],
    ],
    raw: true,
    limit: 1
  });

  return system_prompt;
}
async function updateMessage({ org_id, bridge_id, message, id }) {
  try {

    const [affectedCount, affectedRows] = await models.pg.conversations.update(
      { updated_message : message },
      {
        where: {
          org_id,
          bridge_id,
          id
        },
        returning: true,
      }
    );

    if (affectedCount === 0) {
      return { success: false, message: 'No matching record found to update.' };
    }
    const result = affectedRows.map(row => ({
      id: row.id,
      org_id: row.org_id,
      thread_id: row.thread_id,
      model_name: row.model_name,
      bridge_id: row.bridge_id,
      content: row.message, 
      role: row.message_by,
      function: row.function,
      updated_message: row.updated_message,
      type: row.type,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    return { success: true, result: result };
  } catch (error) {
    console.error('Error updating message:', error);
    return { success: false, message: 'Error updating message' };
  }
}

async function updateStatus({ status, message_id }) {
  try {

    const [affectedCount, affectedRows] = await models.pg.conversations.update(
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
  } catch (error) {
    console.error('Error updating message:', error);
    return { success: false, message: 'Error updating message' };
  }
}

async function userFeedbackCounts({ bridge_id, startDate, endDate, user_feedback }) {
  const  whereClause = {
    bridge_id,
    user_feedback
  }
  if(startDate && endDate && startDate !== 'null' && endDate !== 'null')
  {
    whereClause.createdAt =  {
      [Sequelize.Op.between]: [startDate, endDate], 
    }
  }
  if (user_feedback === "all" || !user_feedback) {
    whereClause.user_feedback = { [Sequelize.Op.or]: [1,2] };
  } else {
    whereClause.user_feedback = user_feedback;
  }
  const feedbackRecords = await models.pg.conversations.findAll({
    attributes: ["user_feedback"],
    where: whereClause,
    returning: true, 
  });
  return { success: true, result: feedbackRecords.length };
}


async function create(payload) {
  return await models.pg.conversations.create(payload);
}

const findMessageByMessageId = async (bridge_id, org_id, thread_id, message_id) =>  await models.pg.conversations.findOne({
  where: {
    org_id,
    bridge_id,
    thread_id,
    message_id,
    message_by : 'assistant'
  },
  raw: true,
  limit: 1
});
const addThreadId = async (message_id, thread_id, type) => {
  return await models.pg.conversations.update(
    { external_reference: thread_id },
    {
      where: { message_id, message_by: type },
      returning: true
    }
  );
};


async function findThreadMessage(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize) {
  const offset = page && pageSize ? (page - 1) * pageSize : null;
  const limit = pageSize || null;
  const whereClause = {
    org_id: org_id,
    thread_id: thread_id,
    bridge_id: bridge_id,
    sub_thread_id: sub_thread_id
  };

  let conversations = await models.pg.conversations.findAll({
    attributes: [
      [Sequelize.literal(`CASE WHEN message IS NULL OR message = '' THEN chatbot_message ELSE message END`), 'content'],
      ['message_by', 'role'],
      'createdAt',
      'id',
      'is_reset',
      'tools_call_data',
      'image_url'
    ],
    where: whereClause,
    order: [['id', 'DESC']],
    offset: offset,
    limit: limit,
    raw: true
  });
  conversations = conversations.reverse();
  return { conversations };
}


const getSubThreads = async (org_id,thread_id) =>{
    return await Thread.find({ org_id, thread_id });
}

async function getUserUpdates(org_id, version_id, page = 1, pageSize = 10) {
  try {
    const offset = (page - 1) * pageSize;
    const history = await models.pg.user_bridge_config_history.findAll({
      where: {
        org_id: org_id,
        version_id: version_id
      },
      order: [
        ['time', 'DESC'],
      ],
      offset: offset,
      limit: pageSize
    });

    if (history.length === 0) {
      return { success: false, message: "No updates found" };
    }

    return { success: true, updates: history };
  } catch (error) {
    console.error("Error fetching user updates:", error);
    return { success: false, message: "Error fetching updates" };
  }
}



export default {
  findAllThreads,
  findMessageByMessageId,
  deleteLastThread,
  getHistory,
  storeSystemPrompt,
  findMessage,
  findThreadsForFineTune,
  system_prompt_data,
  updateMessage,
  updateStatus,
  create,
  addThreadId,
  userFeedbackCounts,
  findThreadMessage,
  getSubThreads,
  getUserUpdates
};