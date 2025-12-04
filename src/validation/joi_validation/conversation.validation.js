import Joi from 'joi';
import joiObjectId from 'joi-objectid';

Joi.objectId = joiObjectId(Joi);

const getThreads = {
    params: Joi.object().keys({
        thread_id: Joi.string().required(),
        bridge_id: Joi.string().required(), // Can be slug or objectId
    }),
    query: Joi.object().keys({
        pageNo: Joi.number().integer(),
        limit: Joi.number().integer(),
        sub_thread_id: Joi.string(),
    }),
    body: Joi.object().keys({
        org_id: Joi.objectId(),
    }).unknown(false),
};

const createEntry = {
    params: Joi.object().keys({
        thread_id: Joi.string().required(),
        bridge_id: Joi.string().required(),
    }),
    body: Joi.object().keys({
        message: Joi.string().required(),
    }).unknown(false),
};

const userFeedbackCount = {
    params: Joi.object().keys({
        bridge_id: Joi.objectId().required(),
    }),
    query: Joi.object().keys({
        startDate: Joi.string(),
        endDate: Joi.string(),
        user_feedback: Joi.string(),
    }),
};

const getMessageHistory = {
    params: Joi.object().keys({
        bridge_id: Joi.objectId().required(),
    }),
    body: Joi.object().keys({
        org_id: Joi.objectId(),
    }),
    query: Joi.object().keys({
        pageNo: Joi.number().integer(),
        limit: Joi.number().integer(),
        keyword_search: Joi.string().allow('', null),
        startTime: Joi.string(),
        endTime: Joi.string(),
        version_id: Joi.objectId(),
        user_feedback: Joi.string(),
        error: Joi.string(),
    }),
};

const getAllSubThreadsController = {
    params: Joi.object().keys({
        thread_id: Joi.string().required(),
    }),
    query: Joi.object().keys({
        bridge_id: Joi.objectId(),
        error: Joi.string(),
        version_id: Joi.objectId(),
    }),
};

const deleteBridges = {
    params: Joi.object().keys({
        bridge_id: Joi.objectId().required(),
    }),
    body: Joi.object().keys({
        org_id: Joi.objectId(),
        restore: Joi.boolean(),
    }),
};

const getSystemPromptHistory = {
    params: Joi.object().keys({
        bridge_id: Joi.objectId().required(),
        timestamp: Joi.string().required(),
    }),
};

const FineTuneData = {
    params: Joi.object().keys({
        bridge_id: Joi.objectId().required(),
    }),
    body: Joi.object().keys({
        thread_ids: Joi.array().items(Joi.string()).required(),
        user_feedback: Joi.string(),
    }),
};

const updateThreadMessage = {
    params: Joi.object().keys({
        bridge_id: Joi.objectId().required(),
    }),
    body: Joi.object().keys({
        message: Joi.string().required(),
        id: Joi.number().required(),
    }),
};

const updateMessageStatus = {
    params: Joi.object().keys({
        status: Joi.string().required(),
    }),
    body: Joi.object().keys({
        message_id: Joi.string().required(),
        bridge_id: Joi.objectId().required(),
    }),
};

const getThreadMessages = {
    params: Joi.object().keys({
        thread_id: Joi.string().required(),
        bridge_id: Joi.string().required(),
    }),
    query: Joi.object().keys({
        pageNo: Joi.number().integer(),
        limit: Joi.number().integer(),
        sub_thread_id: Joi.string(),
    }),
};

const bridgeArchive = {
    params: Joi.object().keys({
        bridge_id: Joi.objectId().required(),
    }),
    body: Joi.object().keys({
        status: Joi.number().valid(0, 1).required(),
    }),
};

const getAllUserUpdates = {
    params: Joi.object().keys({
        version_id: Joi.objectId().required(),
    }),
    query: Joi.object().keys({
        page: Joi.number().integer(),
        limit: Joi.number().integer(),
    }),
};

export default {
    getThreads,
    createEntry,
    userFeedbackCount,
    getMessageHistory,
    getAllSubThreadsController,
    deleteBridges,
    getSystemPromptHistory,
    FineTuneData,
    updateThreadMessage,
    updateMessageStatus,
    getThreadMessages,
    bridgeArchive,
    getAllUserUpdates,
};
