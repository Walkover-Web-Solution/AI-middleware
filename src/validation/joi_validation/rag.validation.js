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
    docType: Joi.string().optional(),
    fileFormat: Joi.string().valid('csv', 'txt', 'script', 'unknown').optional().messages({
        'any.required': 'fileFormat is required'
    }),
    nestedCrawling: Joi.boolean().default(false)
}).unknown(true);

const docIdSchema = Joi.object({
    id: Joi.string().required().messages({
        'any.required': 'id is required'
    })
}).unknown(true);

const updateDocSchema = Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional()
}).unknown(true);

const searchSchema = Joi.object({
    query: Joi.string().required().messages({
        'any.required': 'query is required'
    }),
    agent_id: Joi.string().required().messages({
        'any.required': 'agent_id is required'
    })
}).unknown(true);

const createCollectionSchema = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Collection name is required'
    }),
    settings: Joi.object({
        denseModel: Joi.string().optional(),
        sparseModel: Joi.string().optional(),
        chunkSize: Joi.number().integer().optional(),
        chunkOverlap: Joi.number().integer().optional(),
        rerankerModel: Joi.string().optional(),
        strategy: Joi.string().optional()
    }).optional()
}).unknown(true);

const createResourceSchema = Joi.object({
    collectionId: Joi.string().required().messages({
        'any.required': 'collectionId is required'
    }),
    title: Joi.string().required().messages({
        'any.required': 'title is required'
    }),
    ownerId: Joi.string().optional(),
    content: Joi.string().required().messages({
        'any.required': 'content is required'
    }),
    url: Joi.string().uri().optional(),
    settings: Joi.object({
        strategy: Joi.string().optional(),
        chunkingUrl: Joi.string().uri().optional(),
        chunkingType: Joi.string().optional(),
        chunkSize: Joi.number().integer().optional(),
        chunkOverlap: Joi.number().integer().optional()
    }).optional()
}).unknown(true);

const collectionIdSchema = Joi.object({
    collectionId: Joi.string().required().messages({
        'any.required': 'collectionId is required'
    })
}).unknown(true);

const resourceIdSchema = Joi.object({
    id: Joi.string().required().messages({
        'any.required': 'Resource id is required'
    })
}).unknown(true);

const updateResourceSchema = Joi.object({
    title: Joi.string().optional(),
    description: Joi.string().optional(),
    content: Joi.string().optional(),
    url: Joi.string().uri().optional()
}).or('content', 'url').messages({
    'object.missing': 'At least one of content or url is required'
}).unknown(true);

export {
    createVectorsSchema,
    docIdSchema,
    updateDocSchema,
    searchSchema,
    createCollectionSchema,
    createResourceSchema,
    collectionIdSchema,
    resourceIdSchema,
    updateResourceSchema
};
