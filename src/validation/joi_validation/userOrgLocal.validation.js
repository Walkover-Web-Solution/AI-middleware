import Joi from "joi";

const idSchema = Joi.alternatives().try(
    Joi.number().integer(),
    Joi.string().trim().min(1)
);

const switchUserOrgLocal = {
    body: Joi.object().keys({
        orgId: idSchema.required(),
        orgName: Joi.string().allow("", null)
    })
};

const updateUserDetails = {
    body: Joi.object().keys({
        company_id: idSchema,
        company: Joi.object(),
        user_id: idSchema,
        user: Joi.object()
    }).or('company_id', 'user_id').and('company_id', 'company').and('user_id', 'user')
};

const removeUsersFromOrg = {
    body: Joi.object().keys({
        user_id: idSchema.required()
    })
};

export default {
    switchUserOrgLocal,
    updateUserDetails,
    removeUsersFromOrg
};
