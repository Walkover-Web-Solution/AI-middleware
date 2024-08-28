import templateDBservices from "../db_services/templateDBservices.js";

// Controller to get all templates
const getAllTemplates = async (req, res) => {
  try {
    const {
      org_id
    } = req.body;
    const result = await templateDBservices.getAllTemplate(org_id);
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    console.error("Error fetching templates =>", error.message);
    return res.status(400).json({
      success: false,
      error: "Something went wrong!!",
    });
  }
};

// Controller to create a new template
const createTemplate = async (req, res) => {
  try {
    const { templateName, template, org_id } = req.body;
    
    const result = await templateDBservices.createTemplate({ templateName, template, org_id });

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error creating template =>", error.message);
    return res.status(500).json({
      success: false,
      error: "Something went wrong!!",
    });
  }
};

// Controller to update a template by ID
const updateTemplate = async (req, res) => {
  try {
    const { id} = req.params;
    const { templateName, template} = req.body;
    const result = await templateDBservices.updateTemplate({ id, templateName, template});
    
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    console.error("Error updating template =>", error.message);
    return res.status(500).json({
      success: false,
      error: "Something went wrong!!",
    });
  }
};

// Controller to delete a template by ID
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await templateDBservices.deleteTemplate(id);
    
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    console.error("Error deleting template =>", error.message);
    return res.status(500).json({
      success: false,
      error: "Something went wrong!!",
    });
  }
};

export default {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
