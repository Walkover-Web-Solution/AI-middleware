import Joi from "joi";

const promptWrapperIdSchema = Joi.object({
  wrapper_id: Joi.string().required().messages({
    "any.required": "wrapper_id is required",
  }),
}).unknown(true);

const createPromptWrapperSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "any.required": "name is required",
  }),
  template: Joi.string().required().messages({
    "any.required": "template is required",
  }),
}).unknown(true);

const updatePromptWrapperSchema = Joi.object({
  name: Joi.string().trim(),
  template: Joi.string(),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required for update",
  })
  .unknown(true);

export { createPromptWrapperSchema, updatePromptWrapperSchema, promptWrapperIdSchema };
