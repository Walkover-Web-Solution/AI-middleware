import Joi from 'joi';

const getWeeklyreports = {
    body: Joi.object().keys({}).unknown(false),
};

const getMessageData = {
    body: Joi.object().keys({
        message_id: Joi.string().required(),
    }).unknown(false),
};

export default {
    getWeeklyreports,
    getMessageData,
};
