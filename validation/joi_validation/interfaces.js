import Joi from 'joi';

const createInterfaceSchema = Joi.object({
  project_id: Joi.string().alphanum().required(),
  org_id: Joi.string().required(),
  title: Joi.string(),
  created_by: Joi.string().required(),
  updated_by: Joi.string().required(),
});

const getInterfaceSchema = Joi.object({
  project_id: Joi.string().alphanum().required(),
  type: Joi.string().valid('flow', 'embed', 'code', 'template').required(),
});

const getOneInterfaceSchema = Joi.object({
  identifier: Joi.string().alphanum().required(),

});

const getAllInterfaceSchema = Joi.object({
  project_id: Joi.string().alphanum().required(),
});
const deleteComponentInterfaceSchema = Joi.object({
  interfaceId: Joi.string().alphanum().required(),
  gridId: Joi.string().alphanum().required(),
});
const updateInterfaceSchema = Joi.object({
  identifier: Joi.string().alphanum().required(),
  gridId: Joi.string().alphanum().required(),
  componentId: Joi.string().alphanum(),
});
const updateInterfaceDetailsSchema = Joi.object({
  identifier: Joi.string().alphanum().required(),
  title: Joi.string(),
  accessType: Joi.string(),
}).unknown(true);

const deleteActionsInterfaceSchema = Joi.object({
  componentId: Joi.string().alphanum().required(),
  interfaceId: Joi.string().alphanum().required(),
});
const getOneActionInterfaceSchema = Joi.object({
  actionId: Joi.string().alphanum().required(),
});

export {
  createInterfaceSchema,
  getInterfaceSchema,
  getOneInterfaceSchema,
  getAllInterfaceSchema,
  updateInterfaceSchema,
  deleteComponentInterfaceSchema,
  deleteActionsInterfaceSchema,
  getOneActionInterfaceSchema,
  updateInterfaceDetailsSchema,
};
