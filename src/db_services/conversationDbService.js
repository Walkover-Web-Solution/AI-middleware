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
async function findAllThreads(bridge_id,org_id) {
  const threads = await models.conversations.findAll({
    attributes: ['thread_id', [Sequelize.fn('MIN', Sequelize.col('id')), 'id'], 'bridge_id'],
    where: {
      bridge_id,
      org_id
    },
    group: ['thread_id', 'bridge_id'],
    order: [
      ['thread_id', 'ASC'],
      [Sequelize.fn('MIN', Sequelize.col('createdAt')), 'ASC'], // Use MIN to get the earliest createdAt within each group
    ],
  });

  // If you want to return the result directly
  return threads;
}
module.exports = {
  find,
  createBulk,
  findAllThreads,
  deleteLastThread
}