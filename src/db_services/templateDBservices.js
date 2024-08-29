import { templateModel } from "../mongoModel/template.js";
const createTemplate = async ({ templateName, template, org_id }) => {
  try {
    if (!templateName || !template) {
      return {
        success: false,
        error: "Template name and Template prompt are required!",
      };
    }

    const newTemplate = new templateModel({
      templateName,
      template,
      org_id,
      created_at: new Date(),
      updated_at: new Date()
    });

    const savedTemplate = await newTemplate.save();

    return {
      success: true,
      data: savedTemplate,
    };
  } catch (error) {
    console.error("Error creating template =>", error);
    return {
      success: false,
      error: "Something went wrong!",
    };
  }
};

  

const getAllTemplate = async (org_id) => {
  try {
    const findTemp = await templateModel.find({ org_id }).exec();

    return {
      success: true,
      data: findTemp,
      message: findTemp.length === 0 ? "No templates found" : undefined,
    };
  } catch (error) {
    console.error("Error fetching templates =>", error);
    return {
      success: false,
      error: "Something went wrong!",
    };
  }
};
  


const updateTemplate = async ({ id, templateName, template }) => {
  try {
    if (!templateName && !template) {
      return {
        success: false,
        error: "At least one of Template Name or Template prompt is required!",
      };
    }

    const updatedTemplate = await templateModel.findByIdAndUpdate(
      id,
      { templateName, template, updated_at: new Date() },
      { new: true }
    );

    if (!updatedTemplate) {
      return {
        success: false,
        error: "Template not found!",
      };
    }

    return {
      success: true,
      data: updatedTemplate,
    };
  } catch (error) {
    console.error("Error updating template =>", error);
    return {
      success: false,
      error: "Something went wrong!",
    };
  }
};

  

  const deleteTemplate = async (id) => {
    try {
      const deletedTemplate = await templateModel.findByIdAndDelete(id);
  
      if (!deletedTemplate) {
        return {
          success: false,
          error: "Template not found!",
        };
      }
  
      return {
        success: true,
        message: "Template deleted successfully!",
      };
    } catch (error) {
      console.error("Error deleting template =>", error);
      return {
        success: false,
        error: "Something went wrong!",
      };
    }
  };
  
  
export default{
    getAllTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate
}
