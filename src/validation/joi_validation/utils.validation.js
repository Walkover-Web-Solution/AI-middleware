import Joi from 'joi';

const clearRedisCache = {
    body: Joi.object().keys({
        id: Joi.string().optional(),
        ids: Joi.alternatives().try(
            Joi.string(),
            Joi.array().items(Joi.string())
        ).optional(),
    }),
};

const getRedisCache = {
    params: Joi.object().keys({
        id: Joi.string().required(),
    }),
};

const callAi = {
    body: Joi.object().keys({
        type: Joi.string().valid('structured_output', 'gpt_memory', 'improve_prompt').required(),
        json_schema: Joi.alternatives().conditional('type', {
            is: 'structured_output',
            then: Joi.alternatives().try(Joi.object(), Joi.string()).required(),
            otherwise: Joi.forbidden()
        }),
        query: Joi.alternatives().conditional('type', {
            is: 'structured_output',
            then: Joi.string().required(),
            otherwise: Joi.forbidden()
        }),
        thread_id: Joi.alternatives().conditional('type', {
            is: 'structured_output',
            then: Joi.string().optional(),
            otherwise: Joi.alternatives().conditional('type', {
                is: 'gpt_memory',
                then: Joi.string().required(),
                otherwise: Joi.forbidden()
            })
        }),
        bridge_id: Joi.alternatives().conditional('type', {
            is: 'gpt_memory',
            then: Joi.string().required(),
            otherwise: Joi.forbidden()
        }),
        sub_thread_id: Joi.alternatives().conditional('type', {
            is: 'gpt_memory',
            then: Joi.string().required(),
            otherwise: Joi.forbidden()
        }),
        version_id: Joi.alternatives().conditional('type', {
            is: 'gpt_memory',
            then: Joi.string().optional(),
            otherwise: Joi.forbidden()
        }),
        variables: Joi.alternatives().conditional('type', {
            is: 'improve_prompt',
            then: Joi.object().required(),
            otherwise: Joi.forbidden()
        })
    }),
};

export default {
    clearRedisCache,
    getRedisCache,
    callAi
};
