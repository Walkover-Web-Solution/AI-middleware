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


async function findMessage(org_id, thread_id, bridge_id) {
  let conversations = await models.pg.conversations.findAll({
    attributes: [['message', 'content'], ['message_by', 'role'], 'createdAt', 'id', 'function','is_reset','chatbot_message'],
    include: [{
      model: models.pg.raw_data,
      as: 'raw_data',
      attributes: ['*'],
      required: false,
      on: {
        id: models.pg.sequelize.where(models.pg.sequelize.col('conversations.id'), '=', models.pg.sequelize.col('raw_data.chat_id'))
      }
    }],
    where: {
      org_id: org_id,
      thread_id: thread_id,
      bridge_id: bridge_id
    },
    order: [['id', 'DESC']],
    raw: true
  });

  conversations = conversations.reverse();
  return conversations;
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

async function findThreadsForFineTune(org_id, thread_id, bridge_id) {
  let conversations = await models.pg.conversations.findAll({
    attributes: [
      ['message', 'content'],
      ['message_by', 'role'],
      'createdAt',
      'id',
      'function',
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
    where: {
      org_id,
      thread_id,
      bridge_id
    },
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

export default {
  find,
  createBulk,
  findAllThreads,
  deleteLastThread,
  storeSystemPrompt,
  getHistory,
  findMessage,
  getAllPromptHistory,
  findThreadsForFineTune,
  system_prompt_data
};

// findMessage("124dfgh67ghj","12","662662ebdece5b1b8474c8f4")