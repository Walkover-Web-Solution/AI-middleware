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


async function findMessage(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize, user_feedback, version_id, isChatbot) {
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
  
  const whereClause = whereConditions.join(' AND ');
  
  let countResult = [{ total: 0 }];
  // Only execute count query if not chatbot
  if (!isChatbot) {
    const countQuery = `
      SELECT COUNT(*) as total
      FROM conversations
      WHERE conversations.org_id = '${org_id}'
        AND thread_id = '${thread_id}'
        AND bridge_id = '${bridge_id}'
        AND sub_thread_id = '${sub_thread_id}'
    `;
    countResult = await models.pg.sequelize.query(countQuery, { type: models.pg.sequelize.QueryTypes.SELECT });
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
  const totalEntries = parseInt(countResult[0].total);
  
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
async function findAllThreads(bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search,user_feedback=null) {
  const whereClause = {
    bridge_id,
    org_id,
  };
  if(user_feedback && user_feedback !== "all")
    {
      whereClause.user_feedback = user_feedback  
  }

  // Handle the date range filter
  if (startTimestamp && endTimestamp) {
    whereClause.updatedAt = {
      [Sequelize.Op.between]: [new Date(startTimestamp), new Date(endTimestamp)],
    };
  }

  // Handle the keyword search filter
  if (keyword_search) {
    whereClause[Sequelize.Op.and] = [
      {
        [Sequelize.Op.or]: [
          Sequelize.where(Sequelize.cast(Sequelize.col('function'), 'text'), {
            [Sequelize.Op.like]: `%${keyword_search}%`,
          }),
          { message: { [Sequelize.Op.like]: `%${keyword_search}%` } },
          Sequelize.where(Sequelize.cast(Sequelize.col('thread_id'), 'text'), {
            [Sequelize.Op.like]: `%${keyword_search}%`,
          }),
          Sequelize.where(Sequelize.cast(Sequelize.col('message_id'), 'text'), {
            [Sequelize.Op.like]: `%${keyword_search}%`,
          }),
          Sequelize.where(Sequelize.cast(Sequelize.col('sub_thread_id'), 'text'), {
            [Sequelize.Op.like]: `%${keyword_search}%`,
          }), // Added for sub_thread_id search
        ],
      },
    ];
  }

  // Define the common attributes to select
  const attributes = keyword_search
    ? [
        'thread_id',
        [Sequelize.fn('MIN', Sequelize.col('id')), 'id'],
        'bridge_id',
        [Sequelize.fn('MAX', Sequelize.col('updatedAt')), 'updatedAt'],
        'message',
        'message_id',
        'sub_thread_id', // Added sub_thread_id in the selected attributes
      ]
    : [
        'thread_id',
        [Sequelize.fn('MIN', Sequelize.col('id')), 'id'],
        'bridge_id',
        [Sequelize.fn('MAX', Sequelize.col('updatedAt')), 'updatedAt'],
      ];

  // Execute the query
  const threads = await models.pg.conversations.findAll({
    attributes,
    where: whereClause,
    group: keyword_search
      ? ['thread_id', 'bridge_id', 'message', 'message_id', 'sub_thread_id'] // Added sub_thread_id in the group by
      : ['thread_id', 'bridge_id'],
    order: [
      [Sequelize.col('updatedAt'), 'DESC'],
      ['thread_id', 'ASC'],
    ],
    limit,
    offset: (pageNo - 1) * limit,
  });



  const uniqueThreads = new Map();

  threads.forEach(thread => {
    let matchedField = null;

    if (thread.message && thread.message.includes(keyword_search)) {
        matchedField = 'message';
    } else if (thread.message_id && thread.message_id.toString().includes(keyword_search)) {
        matchedField = 'message_id';
    } else if (thread.thread_id && thread.thread_id.toString().includes(keyword_search)) {
        matchedField = 'thread_id';
    } else if (thread.sub_thread_id && thread.sub_thread_id.toString().includes(keyword_search)) { // Check for sub_thread_id match
        matchedField = 'sub_thread_id'; // If sub_thread_id matches, set matchedField to 'sub_thread_id'
    } else {
        matchedField = 'thread_id';
    }

    // Define the key based on `bridge_id` and `thread_id` to ensure uniqueness only for `thread_id` matches
    const uniqueKey = matchedField === 'thread_id' ? `${thread.bridge_id}-${thread.thread_id}` : null;

    // Only add unique entries for `thread_id`, allow duplicates otherwise
    if (matchedField !== 'thread_id' || !uniqueThreads.has(uniqueKey)) {
      // Create the response object
      const response = {
        thread_id: thread.thread_id,
        id: thread.id,
        bridge_id: thread.bridge_id,
        matchedField
      };
      // Include additional fields only if matchedField is not 'thread_id'
      if (matchedField !== 'thread_id' ) {
        if (!response.message) {
            response.message = [];  
        }
        // Push an object containing the message and message_id to the message array
        response.message.push({
            message: thread.message,
            message_id: thread.message_id
        });
      }

      // Store unique entry if `matchedField` is 'thread_id', otherwise allow duplicates
      if (matchedField === 'thread_id') {
        uniqueThreads.set(thread.thread_id, response);
      }
      else if (matchedField !== 'thread_id' && uniqueThreads.has(thread.thread_id)) {
        // Retrieve the existing thread object from the map
        const existingThread = uniqueThreads.get(thread.thread_id);
    
        // Check if 'message' is present or exists in the existing thread
        if (existingThread && existingThread.message) {
            // If message exists, push the new message to the array
            existingThread.message.push({
                message: thread.message,
                message_id: thread.message_id
            });
        } else {            
            // Optionally, initialize the message array if needed
            uniqueThreads.set(thread.thread_id, {
                ...existingThread,
                message: [{
                    message: thread.message,
                    message_id: thread.message_id
                }]
            });
        }
    }
       else {
        uniqueThreads.set(`${thread.thread_id}`, response);
      }
    }
  });

  // Convert the Map values to an array
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