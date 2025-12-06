import Joi from "joi";

const createVectorsSchema = Joi.object({
    url: Joi.string().uri().required().messages({
        'any.required': 'url is required',
        'string.uri': 'url must be a valid URI'
    }),
    chunking_type: Joi.string().valid('auto', 'semantic', 'manual', 'recursive', 'agentic').default('auto'),
    chunk_size: Joi.number().integer().min(1).default(512),
    chunk_overlap: Joi.number().integer().min(0).default(70),
    name: Joi.string().required().messages({
        'any.required': 'name is required'
    }),
    description: Joi.string().required().messages({
        'any.required': 'description is required'
    }),
    docType: Joi.string().required(),
    fileFormat: Joi.string().valid('csv', 'txt', 'script', 'unknown').required(),
    nestedCrawling: Joi.boolean().default(false)
});

const docIdSchema = Joi.object({
    id: Joi.string().required().messages({
        'any.required': 'id is required'
    })
});

const updateDocSchema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional()
});

export {
    createVectorsSchema,
    docIdSchema,
    updateDocSchema
};
