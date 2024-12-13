import models from "../../models/index.js";
import Sequelize from "sequelize";

async function createBulk(data) {
  return await models.pg.conversations.bulkCreate(data);
}
async function find(org_id, thread_id, bridge_id) {
  let conversations = await models.pg.conversations.findAll({
    attributes: [['message', 'content'], ['message_by', 'role'], 'createdAt', 'id', "function"],
    where: {
      org_id,
      thread_id,
      bridge_id
    },
    order: [['id', 'DESC']],
    limit: 6,
    raw: true
  });
  conversations = conversations.reverse();
  // If you want to return the result directly
  return conversations;
}

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
async function getAllPromptHistory(bridge_id,page, pageSize) {
  try {
    const history = await models.pg.system_prompt_versionings.findAll({
      where: {
        bridge_id
      },
      order: [
        ['updated_at', 'DESC'],
      ],
    raw: true,
    limit: pageSize,
    offset: (page - 1) * pageSize
    });
    if (history.length === 0) {
      return { success: true, message: "No prompts found for the given bridge_id" };
    }

    return { success: true, history };
  } catch (error) {
    console.error("get history system prompt error=>", error);
    return { success: false, message: "Error retrieving prompts" };
  }
}


async function findMessage(org_id, thread_id, bridge_id, sub_thread_id, page, pageSize) {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  let conversations = await models.pg.conversations.findAll({
    attributes: [
      ['message', 'content'],
      ['message_by', 'role'],
      'createdAt',
      'id',
      'function',
      'is_reset',
      "version_id",
      'chatbot_message',
      'updated_message',
      'tools_call_data',
      'message_id',
      'user_feedback',
      'sub_thread_id',
      'image_url'
    ],
    include: [
      {
        model: models.pg.raw_data,
        as: 'raw_data',
        attributes: ['*'],
        required: false,
        on: {
          id: models.pg.sequelize.where(
            models.pg.sequelize.col('conversations.id'),
            '=',
            models.pg.sequelize.col('raw_data.chat_id')
          )
        }
      }
    ],
    where: {
      org_id: org_id,
      thread_id: thread_id,
      bridge_id: bridge_id,
      sub_thread_id: sub_thread_id
    },
    order: [['id', 'DESC']],
    offset: offset,
    limit: limit,
    raw: true
  });
  conversations = conversations.reverse();
  const totalEntries = await models.pg.conversations.count({
    where: {
      org_id: org_id,
      thread_id: thread_id,
      bridge_id: bridge_id,
      sub_thread_id: sub_thread_id
    }
  });
  const totalPages = Math.ceil(totalEntries / limit);
  return { conversations, totalPages, totalEntries };
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
async function findAllThreads(bridge_id, org_id, pageNo, limit, startTimestamp, endTimestamp, keyword_search) {
  const whereClause = {
    bridge_id,
    org_id,
  };

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
      ? ['thread_id', 'bridge_id', 'message', 'message_id']
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


export default {
  find,
  createBulk,
  findAllThreads,
  findMessageByMessageId,
  deleteLastThread,
  storeSystemPrompt,
  getHistory,
  findMessage,
  getAllPromptHistory,
  findThreadsForFineTune,
  system_prompt_data,
  updateMessage,
  updateStatus,
  create,
  addThreadId
};