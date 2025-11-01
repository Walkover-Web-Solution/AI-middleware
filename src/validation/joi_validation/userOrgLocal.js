import Joi from "joi";

const idSchema = Joi.alternatives().try(
    Joi.number().integer(),
    Joi.string().trim().min(1)
);

const userOrgLocalTokenSchema = Joi.object({
    userId: idSchema.required(),
    orgId: idSchema.required(),
    userName: Joi.string().allow("", null),
    orgName: Joi.string().allow("", null)
});

const switchUserOrgLocalSchema = Joi.object({
    orgId: idSchema.required(),
    orgName: Joi.string().allow("", null)
});

export {
    userOrgLocalTokenSchema,
    switchUserOrgLocalSchema
};
