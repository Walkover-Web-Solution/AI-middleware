import Joi from "joi";

const searchSchema = Joi.object({
  query: Joi.string().required().messages({
    "any.required": "query is required",
  }),
  collection_id: Joi.string().optional(),
  resource_id: Joi.string().optional(),
  owner_id: Joi.string().optional(),
})
  .custom((value, helpers) => {
    const { collection_id, resource_id, owner_id } = value;

    // Either collection_id or resource_id must be provided
    if (!collection_id && !resource_id) {
      return helpers.error("custom.searchType", {
        message: "Either collection_id or resource_id must be provided",
      });
    }

    // Both cannot be provided at the same time
    if (collection_id && resource_id) {
      return helpers.error("custom.searchType", {
        message: "Cannot provide both collection_id and resource_id",
      });
    }

    // If collection_id is provided, owner_id is required
    if (collection_id && !owner_id) {
      return helpers.error("custom.ownerIdRequired", {
        message: "owner_id is required when using collection_id",
      });
    }

    return value;
  })
  .messages({
    "custom.searchType": "{{#message}}",
    "custom.ownerIdRequired": "{{#message}}",
  })
  .unknown(true);

const createCollectionSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Collection name is required",
  }),
  settings: Joi.object({
    denseModel: Joi.string().optional(),
    sparseModel: Joi.string().optional(),
    chunkingType: Joi.string().optional(),
    chunkSize: Joi.number().integer().optional(),
    chunkOverlap: Joi.number().integer().optional(),
    rerankerModel: Joi.string().optional(),
    strategy: Joi.string().optional(),
  }).optional(),
}).unknown(true);

const createResourceSchema = Joi.object({
  collection_details: Joi.string().required().messages({
    "any.required": "collectionId is required",
  }),
  title: Joi.string().required().messages({
    "any.required": "title is required",
  }),
  ownerId: Joi.string().optional(),
  content: Joi.string().optional(),
  url: Joi.string().uri().optional(),
  description: Joi.string().required().messages({
    "any.required": "description is required",
  }),
  settings: Joi.object({
    strategy: Joi.string().optional(),
    chunkingUrl: Joi.string().uri().optional(),
    chunkingType: Joi.string().optional(),
    chunkSize: Joi.number().integer().optional(),
    chunkOverlap: Joi.number().integer().optional(),
  }).optional(),
})
  .or("content", "url")
  .messages({
    "object.missing": "At least one of content or url is required",
  })
  .unknown(true);

const collectionIdSchema = Joi.object({
  collectionId: Joi.string().required().messages({
    "any.required": "collectionId is required",
  }),
}).unknown(true);

const resourceIdSchema = Joi.object({
  id: Joi.string().required().messages({
    "any.required": "Resource id is required",
  }),
}).unknown(true);

const updateResourceSchema = Joi.object({
  title: Joi.string().optional(),
  content: Joi.string().optional(),
}).unknown(true);

export {
  searchSchema,
  createCollectionSchema,
  createResourceSchema,
  collectionIdSchema,
  resourceIdSchema,
  updateResourceSchema,
};
