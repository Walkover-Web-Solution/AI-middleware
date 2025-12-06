import Joi from 'joi';

const getAgentsByModel = {
    query: Joi.object().keys({
        model: Joi.string().required(),
    }),
};

export default {
    getAgentsByModel,
};
