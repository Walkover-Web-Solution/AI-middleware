const timescale = require('./../../models/timescale/index.js')
const postgres = require('./../../models/index.js')
const Sequelize = require('sequelize');

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
        [Sequelize.Op.between]: [startTime, endTime],
    } : {
        [Sequelize.Op.between]: [startOfToday(), endOfToday()],
    };

    const queryOptions = {
        where: {
            org_id,
            created_at: dateFilter,
        },
        limit,
        offset,
    };

    const model = startTime && endTime ? timescale.daily_data : timescale.five_minute_data;

    return await model.findAll(queryOptions);
}
async function findOne(id) {
    const model = timescale.raw_data ;
    return await model.findByPk(id);
}

async function findOnePg(id) {
    const model = postgres.raw_data ;
    return await model.findByPk(id);
}


async function create(dataset) {
    console.log("dataset",dataset)
    const insertAiData = dataset.map((DataObject) => ({
        org_id: DataObject.orgId,
        authkey_name: DataObject.authkeyName || 'not_found',
        latency: DataObject.latency || 0,
        service: DataObject.service,
        status: DataObject?.success? true:false,
        model: DataObject.model,
        input_tokens: DataObject.inputTokens || 0,
        output_tokens: DataObject.outputTokens || 0,
        expected_cost: DataObject.expectedCost || 0,
        created_at: new Date(),
    }));
    const insertAiDataInPg = dataset.map((DataObject) => ({
        org_id: DataObject.orgId,
        authkey_name: DataObject.authkeyName || 'not_found',
        latency: DataObject.latency || 0,
        service: DataObject.service,
        status: DataObject?.success? true:false,
        error: (!DataObject.success ? DataObject.error : 'works perfectly fine'),
        model: DataObject.model,
        input_tokens: DataObject.inputTokens || 0,
        output_tokens: DataObject.outputTokens || 0,
        expected_cost: DataObject.expectedCost || 0,
        created_at: new Date(),
    }));
    try {
        await postgres.raw_data.bulkCreate(insertAiDataInPg);
        await timescale.raw_data.bulkCreate(insertAiData);
    } catch (error) {
        // throw new BadRequestError('Error during bulk insert of Ai middleware', error.details);
        console.log('Error during bulk insert of Ai middleware', error);
    }
}


module.exports = {
    find,
    create,
    findOne,
    findOnePg,
};
