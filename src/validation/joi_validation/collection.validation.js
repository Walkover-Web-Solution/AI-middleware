import Joi from "joi";

const createCollectionSchema = Joi.object({
  name: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'Collection name is required',
      'string.empty': 'Collection name cannot be empty'
    }),

  settings: Joi.object({
    denseModel: Joi.string()
      .default('BAAI/bge-large-en-v1.5')
      .messages({
        'string.empty': 'Dense model cannot be empty'
      }),
    sparseModel: Joi.string()
      .default('Qdrant/bm25')
      .messages({
        'string.empty': 'Sparse model cannot be empty'
      }),
    rerankerModel: Joi.string()
      .default('colbert-ir/colbertv2.0')
      .messages({
        'string.empty': 'Reranker model cannot be empty'
      }),
    chunkSize: Joi.number()
      .integer()
      .min(100)
      .max(10000)
      .default(1000)
      .messages({
        'number.min': 'Chunk size must be at least 100',
        'number.max': 'Chunk size cannot exceed 10000'
      }),
    chunkOverlap: Joi.number()
      .integer()
      .min(0)
      .max(500)
      .default(100)
      .messages({
        'number.min': 'Chunk overlap cannot be negative',
        'number.max': 'Chunk overlap cannot exceed 500'
      })
  }).optional()
}).unknown(true);

const getCollectionSchema = Joi.object({
  collection_id: Joi.string()
    .required()
    .messages({
      'any.required': 'collection_id is required',
      'string.empty': 'collection_id cannot be empty'
    })
});

const updateCollectionSchema = Joi.object({
  name: Joi.string().trim(),
  settings: Joi.object({
    denseModel: Joi.string(),
    sparseModel: Joi.string(),
    rerankerModel: Joi.string(),
    chunkSize: Joi.number().integer().min(100).max(10000),
    chunkOverlap: Joi.number().integer().min(0).max(500)
  }).optional()
}).unknown(true);

export { createCollectionSchema, getCollectionSchema, updateCollectionSchema };
