import { templateSchema, updateTemplateSchema } from '../validation/joi_validation/template.js'; 
import TemplateService from '../db_services/templateDbService.js'; 

export const addShowCaseTemplateController = async (req, res, next) => {
  
  const { error } = templateSchema.validate(req.body);
  if (error) {
    res.locals = {
      success: false,
      message: error.details[0].message,
    };
    req.statusCode = 400;
    return next();
  }

  const { title, description, prompt, configuration } = req.body;
  const data = {
    title,
    description,
    prompt,
    configuration,
  };

  
  const result = await TemplateService.create(data);

  res.locals = {
    success: true,
    result,
  };
  req.statusCode = 200;
  return next();
};

export const getShowCaseTemplateController = async (req, res, next) => {
  // No need to validate ID since we're returning all templates
  // Fetch all templates using the service
  const result = await TemplateService.getAll();

  if (!result || result.length === 0) {
    res.locals = {
      success: false,
      message: "No ShowCase Templates found",
    };
    req.statusCode = 404;
    return next();
  }

  res.locals = {
    success: true,
    result,
  };
  req.statusCode = 200;
  return next();
};
export const updateShowCaseTemplateController = async (req, res, next) => {
  // Validate the request body using updateTemplateSchema
  const { error } = updateTemplateSchema.validate(req.body);
  if (error) {
    res.locals = {
      success: false,
      message: error.details[0].message,
    };
    req.statusCode = 400;
    return next();
  }

  const { title, description, prompt, configuration } = req.body;
  const { id } = req.params;

  // Prepare data to update
  const data = { id };

  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (prompt !== undefined) data.prompt = prompt;
  if (configuration !== undefined) data.configuration = configuration;

  // Update ShowCaseTemplate in DB via service
  const result = await TemplateService.update(id, data);

  if (!result) {
    res.locals = {
      success: false,
      message: "Failed to update ShowCase Template",
    };
    req.statusCode = 400;
    return next();
  }

  res.locals = {
    success: true,
    result,
  };
  req.statusCode = 200;
  return next();
};
