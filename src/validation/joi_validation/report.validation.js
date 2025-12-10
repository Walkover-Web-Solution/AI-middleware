import Joi from 'joi';

const getWeeklyreports = {
    body: Joi.object().keys({}).unknown(true),
};

const getMessageData = {
    body: Joi.object().keys({
        message_id: Joi.string().required(),
    }).unknown(true),
};

export default {
    getWeeklyreports,
    getMessageData,
};
