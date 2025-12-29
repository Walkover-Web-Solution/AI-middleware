import Joi from "joi";

const idSchema = Joi.alternatives().try(
    Joi.number().integer(),
    Joi.string().trim().min(1)
);

/**
 * Schema for POST /localToken - userOrgLocalToken
 * No validation needed - uses loginAuth middleware
 */
const userOrgLocalToken = {
    // No validation needed
};

/**
 * Schema for POST /switchOrg - switchUserOrgLocal
 * Validates request body
 */
const switchUserOrgLocalBodySchema = Joi.object().keys({
    orgId: idSchema.required().messages({
        'any.required': 'orgId is required'
    }),
    orgName: Joi.string().allow("", null).optional()
}).unknown(true);

const switchUserOrgLocal = {
    body: switchUserOrgLocalBodySchema
};

/**
 * Schema for PUT /updateDetails - updateUserDetails
 * Validates request body
 */
const updateUserDetailsBodySchema = Joi.object().keys({
    company_id: idSchema.optional(),
    company: Joi.object().optional(),
    user_id: idSchema.optional(),
    user: Joi.object().optional()
}).or('company_id', 'user_id').and('company_id', 'company').and('user_id', 'user').messages({
    'object.missing': 'Either company_id or user_id is required',
    'object.and': 'company_id must be provided with company, and user_id must be provided with user'
}).unknown(true);

const updateUserDetails = {
    body: updateUserDetailsBodySchema
};

/**
 * Schema for DELETE /deleteUser - removeUsersFromOrg
 * Validates request body
 */
const removeUsersFromOrgBodySchema = Joi.object().keys({
    user_id: idSchema.required().messages({
        'any.required': 'user_id is required'
    })
}).unknown(true);

const removeUsersFromOrg = {
    body: removeUsersFromOrgBodySchema
};

export default {
    userOrgLocalToken,
    switchUserOrgLocal,
    updateUserDetails,
    removeUsersFromOrg
};

// Named exports for direct schema access
export {
    switchUserOrgLocalBodySchema,
    updateUserDetailsBodySchema,
    removeUsersFromOrgBodySchema
};
