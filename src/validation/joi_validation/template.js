import Joi from 'joi';

// Joi Schema for Create and Update Template
const templateSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  prompt: Joi.string().optional(),
  configuration: Joi.string().optional(),
});

const updateTemplateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  prompt: Joi.string().optional(),
  configuration: Joi.string().optional(),
});




export {
  templateSchema,
  updateTemplateSchema,
};
