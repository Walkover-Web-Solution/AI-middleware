import Joi from "joi";

const createRichUiTemplateSchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Template name is required'
    }),
    description: Joi.string().optional().allow(''),
    json_schema: Joi.object().required().messages({
        'any.required': 'JSON schema is required'
    }),
    template_format: Joi.object().required().messages({
        'any.required': 'Template format is required'
    }),
    html: Joi.string().required().messages({
        'any.required': 'HTML content is required'
    })
}).unknown(true);

const updateRichUiTemplateSchema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional().allow(''),
    json_schema: Joi.object().optional(),
    template_format: Joi.object().optional(),
    html: Joi.string().optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
}).unknown(true);

const templateIdSchema = Joi.object({
    template_id: Joi.string().required().messages({
        'any.required': 'Template ID is required'
    })
}).unknown(true);

export {
    createRichUiTemplateSchema,
    updateRichUiTemplateSchema,
    templateIdSchema
};
