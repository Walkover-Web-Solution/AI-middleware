import Joi from "joi";

const addResourceSchema = Joi.object({
  collectionId: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'collectionId is required',
      'string.empty': 'collectionId cannot be empty'
    }),
  
  title: Joi.string()
    .required()
    .trim()
    .max(500)
    .messages({
      'any.required': 'title is required',
      'string.empty': 'title cannot be empty',
      'string.max': 'title cannot exceed 500 characters'
    }),
  ownerId: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'ownerId is required',
      'string.empty': 'ownerId cannot be empty'
    }),
  url: Joi.string().uri().optional().messages({
    'string.uri': 'url must be a valid URI'
  }),
  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'description cannot exceed 1000 characters'
    })
}).unknown(true);

const resourceIdSchema = Joi.object({
  resourceId: Joi.string()
    .required()
    .trim()
    .messages({
      'any.required': 'resourceId is required',
      'string.empty': 'resourceId cannot be empty'
    })
}).unknown(true);

const updateResourceSchema = Joi.object({
  collectionId: Joi.string()
    .optional()
    .trim()
    .messages({
      'string.empty': 'collectionId cannot be empty'
    }),
  orgId: Joi.string()
    .optional()
    .trim()
    .messages({
      'string.empty': 'orgId cannot be empty'
    }),
  title: Joi.string()
    .optional()
    .trim()
    .max(500)
    .messages({
      'string.max': 'title cannot exceed 500 characters'
    }),
  ownerId: Joi.string()
    .optional()
    .trim()
    .messages({
      'string.empty': 'ownerId cannot be empty'
    }),
  url: Joi.string().uri().optional().messages({
    'string.uri': 'url must be a valid URI'
  }),
  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'description cannot exceed 1000 characters'
    })
}).unknown(true);

export { addResourceSchema, resourceIdSchema, updateResourceSchema };
