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


async function findMessage(org_id, thread_id, bridge_id, page, pageSize,user_feedback) {
  const offset = (page - 1) * pageSize;
  const limit = pageSize;
  const whereClause = {
    org_id: org_id,
    thread_id: thread_id,
    bridge_id: bridge_id,
  };

  // Conditionally add user_feedback filter based on its value
  if (user_feedback === "all" || !user_feedback) {
    whereClause.user_feedback = { [Sequelize.Op.or]: [null, 0,1,2] };
  } else {
    whereClause.user_feedback = user_feedback;
  }


  let conversations = await models.pg.conversations.findAll({
    attributes: [
      ['message', 'content'],
      ['message_by', 'role'],
      'createdAt',
      'id',
      'function',
      'is_reset',
      'mode',
      'chatbot_message',
      'updated_message',
      'tools_call_data',
      'message_id',
      'user_feedback',
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
    where: whereClause,
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
      bridge_id: bridge_id
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
    org_id
  };

  if (startTimestamp && endTimestamp) {
    whereClause.updatedAt = {
      [Sequelize.Op.between]: [new Date(startTimestamp), new Date(endTimestamp)]
    };
  }
  if (keyword_search) {
    whereClause[Sequelize.Op.and] = [
      {
        [Sequelize.Op.or]: [
          Sequelize.where(Sequelize.cast(Sequelize.col('function'), 'text'), {
            [Sequelize.Op.like]: `%${keyword_search}%`
          }),
          { message: { [Sequelize.Op.like]: `%${keyword_search}%` } }
        ]
      }
    ];
  }

  const threads = await models.pg.conversations.findAll({
    attributes: [
      'thread_id',
      [Sequelize.fn('MIN', Sequelize.col('id')), 'id'],
      'bridge_id',
      [Sequelize.fn('MAX', Sequelize.col('updatedAt')), 'updatedAt']
    ],
    where: whereClause,
    group: ['thread_id', 'bridge_id'],
    order: [
      [Sequelize.col('updatedAt'), 'DESC'],
      ['thread_id', 'ASC']
    ],
    limit,
    offset: (pageNo - 1) * limit
  });

  return threads;
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
  try {
    // Query the database for matching records
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
      attributes: ['bridge_id', 'createdAt', 'id', "user_feedback"],
      where: whereClause,
      returning: true, 
    });

    // Check if any records were found
    if (feedbackRecords.length === 0) {
      return { success: true, message: 'No user feedback records found.' };
    }

    return { success: true, result: feedbackRecords.length };
  } catch (error) {
    console.error('Error retrieving user feedback counts:', error);
    return { success: false, message: 'Error retrieving user feedback counts.' };
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
  userFeedbackCounts
};