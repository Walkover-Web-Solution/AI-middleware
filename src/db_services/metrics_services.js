import combinedModels  from "./../../models/index.js";
const postgres =combinedModels.pg
const timescale = combinedModels.timescale
import Sequelize from "sequelize";
import { savehistory } from "./../controllers/conversationContoller.js";
function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
}
function endOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
}
async function find(org_id, startTime, endTime, limit, offset) {
  const dateFilter = startTime && endTime ? {
    [Sequelize.Op.between]: [startTime, endTime]
  } : {
    [Sequelize.Op.between]: [startOfToday(), endOfToday()]
  };
  const queryOptions = {
    where: {
      org_id,
      created_at: dateFilter
    },
    limit,
    offset
  };
  const model = startTime && endTime ? timescale.daily_data : timescale.five_minute_data;
  return await model.findAll(queryOptions);
}
async function findOne(id) {
  const model = timescale.raw_data;
  return await model.findByPk(id);
}
async function findLastOptionData(thread_id) {
  const model = postgres.last_data_to_show;
  return await model.findOne({ where: { thread_id } });
}

async function findOnePg(id) {
  const model = postgres.raw_data;
  return await model.findByPk(id);
}
async function create(dataset, historyParams) {
  try {
      const result = await savehistory(historyParams.thread_id, historyParams.user, historyParams.message, historyParams.org_id, historyParams.bridge_id, historyParams.model, historyParams.channel, historyParams.type, historyParams.actor,historyParams.tools);
      let ChatId = result.result[0].dataValues.id;
      dataset[0].chat_id = ChatId;
      const insertAiData = dataset.map(DataObject => ({
        org_id: DataObject.orgId,
        authkey_name: DataObject.authkeyName || 'not_found',
        latency: DataObject.latency || 0,
        service: DataObject.service,
        status: DataObject?.success ? true : false,
        model: DataObject.model,
        input_tokens: DataObject.inputTokens || 0,
        output_tokens: DataObject.outputTokens || 0,
        expected_cost: DataObject.expectedCost || 0,
        created_at: new Date()
      }));

      const insertAiDataInPg = dataset.map(DataObject => ({
        org_id: DataObject.orgId,
        authkey_name: DataObject.authkeyName || 'not_found',
        latency: DataObject.latency || 0,
        service: DataObject.service,
        status: DataObject?.success ? true : false,
        error: !DataObject.success ? DataObject.error : 'No error',
        model: DataObject.model,
        input_tokens: DataObject.inputTokens || 0,
        output_tokens: DataObject.outputTokens || 0,
        expected_cost: DataObject.expectedCost || 0,
        created_at: new Date(),
        chat_id: DataObject.chat_id || null,
        variables: DataObject.variables || {},
        is_present: Object.prototype.hasOwnProperty.call(DataObject, 'prompt')
      }));
      await postgres.raw_data.bulkCreate(insertAiDataInPg);
      await timescale.raw_data.bulkCreate(insertAiData);
  } catch (error) {
    // throw new BadRequestError('Error during bulk insert of Ai middleware', error.details);
    console.error('Error during bulk insert of Ai middleware', error);
  }
}
export default {
  find,
  create,
  findOne,
  findOnePg,
  findLastOptionData
};