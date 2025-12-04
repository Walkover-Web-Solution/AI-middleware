import templateService from "../db_services/templateDbservice.js";

async function allTemplates(req, res, next) {
  const result = await templateService.getAll();
  res.locals = {
    success: true,
    result,
  };
  req.statusCode = 200;
  return next();
}

export { allTemplates };
