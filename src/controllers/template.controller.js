import templateService from "../db_services/template.service.js";

const allTemplates = async (req, res, next) => {
  const result = await templateService.getAll();
  res.locals = {
    success: true,
    result,
  };
  req.statusCode = 200;
  return next();
};

export default {
  allTemplates
};
