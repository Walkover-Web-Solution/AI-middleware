const models = require('../../models/index.js')
const Sequelize = require('sequelize');
async function createBulk(data) {
  return await models.conversations.bulkCreate(data);
}
async function find(org_id, thread_id,bridge_id) {
  let conversations = await models.conversations.findAll({
    attributes: [['message', 'content'], ['message_by', 'role'],'createdAt','id',"function"],
    where: {
        org_id,
        thread_id,
        bridge_id
    },
    order: [
      ['id', 'DESC'],
    ],
    limit: 6,
    raw: true
  });
  conversations=conversations.reverse();
  // If you want to return the result directly
  return conversations;
}
async function findAllMessages(org_id, thread_id,bridge_id,page=1,pageSize=10) {
  let conversations = await models.conversations.findAll({
    attributes: [['message', 'content'], ['message_by', 'role'],'createdAt','id',"function"],
    where: {
        org_id,
        thread_id,
        bridge_id
    },
    order: [
      ['id', 'DESC'],
    ],
    raw: true,
    limit: pageSize,
    offset: (page - 1) * pageSize
  });
  conversations=conversations.reverse();
  // If you want to return the result directly
  return conversations;
}

async function getHistory(bridge_id, timestamp) {
  try {
    const history = await models.system_prompt_versionings.findAll({
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
    return { success: false, message: "Prompt not found" };
  }
}


async function findMessage(org_id, thread_id, bridge_id) {

  let conversations = await models.conversations.findAll({
    attributes: [
      ['message', 'content'],
      ['message_by', 'role'],
      'createdAt',
      'id',
      'function'
    ],
    include: [{
      model: models.raw_data,
      as: 'raw_data',
      attributes: ['*'],
      required: false,
      on: {
        'id': models.sequelize.where(models.sequelize.col('conversations.id'), '=', models.sequelize.col('raw_data.chat_id'))
      }
    }],
    where: {
      org_id: org_id,
      thread_id: thread_id,
      bridge_id: bridge_id
    },
    order: [
      ['id', 'DESC']
    ],
    raw: true
  });
  conversations=conversations.reverse();
  return conversations;
}

async function deleteLastThread(org_id, thread_id,bridge_id) {
  const recordsTodelete=await models.conversations.findOne({
    where: {
        org_id,
        thread_id,
        bridge_id,
        message_by:"tool_calls"
    },
    order: [
      ['id', 'DESC'],
    ]
  })
  if(recordsTodelete){
    await recordsTodelete.destroy();
    return {success:true}
  }
  return {success:false}
}
// Find All conversation db Service
async function findAllThreads(bridge_id, org_id, page, pageSize) {
  const threads = await models.conversations.findAll({
    attributes: ['thread_id',[Sequelize.fn('MIN', Sequelize.col('id')), 'id'], 'bridge_id',
      [Sequelize.fn('MAX', Sequelize.col('updatedAt')), 'updatedAt']
    ],
    where: {
      bridge_id,
      org_id
    },
    group: ['thread_id', 'bridge_id'], 
    order: [
      [Sequelize.col('updatedAt'), 'DESC'], 
      ['thread_id', 'ASC']
    ],
   limit: pageSize,
    offset: (page - 1) * pageSize
  });

  return threads;
}

async function storeSystemPrompt(promptText, orgId, bridgeId) {
  try {
          await models.system_prompt_versionings.create({
              system_prompt: promptText,
              org_id: orgId,
              bridge_id: bridgeId,
              created_at: new Date(),
              updated_at: new Date() 
          });
      console.log('System prompt saved successfully.');
  } catch (error) {
      console.error('Error storing system prompt:', error);
  }
}



module.exports = {
  find,
  createBulk,
  findAllThreads,
  deleteLastThread,
  findAllMessages,
  storeSystemPrompt,
  getHistory,
  findMessage
}
