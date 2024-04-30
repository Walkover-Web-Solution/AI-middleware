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
async function findAllThreads(bridge_id,org_id,page=1,pageSize=10) {
  const threads = await models.conversations.findAll({
    attributes: [
      'thread_id',
      [Sequelize.fn('MIN', Sequelize.col('id')), 'id'],  // Min id for each thread_id
      [Sequelize.fn('MIN', Sequelize.col('bridge_id')), 'bridge_id'],  // Min bridge_id for each thread_id
      [Sequelize.fn('MIN', Sequelize.col('createdAt')), 'minCreatedAt']  // Min createdAt for each thread_id
    ],
    where: {
      bridge_id,
      org_id
    },
    group: ['thread_id'],  // Only group by thread_id
    order: [
      ['thread_id', 'ASC'],
      [Sequelize.col('minCreatedAt'), 'ASC']  // Order by the earliest createdAt
    ],
    limit: pageSize,
    offset: (page - 1) * pageSize
  }
  );
  // If you want to return the result directly
  return threads;
}
module.exports = {
  find,
  createBulk,
  findAllThreads,
  deleteLastThread,
  findAllMessages
}