import templateDBservices from "../db_services/templateDBservices.js";

const getAllTemplates = async (req, res) => {
  
  try {
    const { org_id } = req.body;
    const result = await templateDBservices.getAllTemplate(org_id);
    
    const status = result.success ? 200 : 400;
    return res.status(status).json(result);
  } catch (error) {
    console.error("Error fetching templates =>", error.message);
    return res.status(500).json({
      success: false,
      error: "Something went wrong!",
    });
  }
};

const createTemplate = async (req, res) => {
  const { templateName, template, org_id } = req.body;
  
  try {
    const result = await templateDBservices.createTemplate({ templateName, template, org_id });
    
    const status = result.success ? 201 : 400;
    return res.status(status).json(result);
  } catch (error) {
    console.error("Error creating template =>", error.message);
    return res.status(500).json({
      success: false,
      error: "Something went wrong!",
    });
  }
};

const updateTemplate = async (req, res) => {
  const { id } = req.params;
  const { templateName, template } = req.body;

  try {
    const result = await templateDBservices.updateTemplate({ id, templateName, template });

    const status = result.success ? 200 : (result.error === "Template not found!" ? 404 : 400);
    return res.status(status).json(result);
  } catch (error) {
    console.error("Error updating template =>", error.message);
    return res.status(500).json({
      success: false,
      error: "Something went wrong!",
    });
  }
};

const deleteTemplate = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await templateDBservices.deleteTemplate(id);
    
    const status = result.success ? 200 : (result.error === "Template not found!" ? 404 : 400);
    return res.status(status).json(result);
  } catch (error) {
    console.error("Error deleting template =>", error.message);
    return res.status(500).json({
      success: false,
      error: "Something went wrong!",
    });
  }
};


export default {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
