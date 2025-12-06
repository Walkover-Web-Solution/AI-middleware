import Joi from "joi";

const loginPublicUser = {
    body: Joi.object().keys({
        user_id: Joi.string().optional()
    })
};

const getAgent = {
    params: Joi.object().keys({
        slug_name: Joi.string().required()
    })
};

export default {
    loginPublicUser,
    getAgent
};
