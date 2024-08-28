import { templateModel } from "../mongoModel/template.js";
import mongoose from "mongoose";
// Create a new template
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
      created_at: Date.now()
    });

    await newTemplate.save();

    return {
      success: true,
      data: newTemplate,
    };
  } catch (error) {
    console.error("Error creating template =>", error);
    return {
      success: false,
      error: "Something went wrong!!",
    };
  }
};
  

// Read all templates
const getAllTemplate = async org_id  => {
    try {
      const findTemp = await templateModel.find({
        org_id: org_id
      });
  
      if (findTemp.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "No templates found",
        });
      }
  
      return {
        success: true,
        data: findTemp,
      };
    } catch (error) {
      console.error("Error fetching templates =>", error);
      return {
        success: false,
        error: "Something went wrong!!",
      };
    }
  };
  


// Update a template by ID
const updateTemplate = async ({ id, templateName, template}) => {
    try {
      if (!templateName && !template) {
        return {
          success: false,
          error: "Template Name and Template prompt are required!",
        };
      }
  
      const updatedTemplate = await templateModel.findOneAndUpdate(
        {
          id,
          templateName,
          template,
          updated_at: Date.now(),
        }
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
        error: "Something went wrong!!",
      };
    }
  };
  

// Delete a template by ID
const deleteTemplate = async (id) => {
    try {
      const deletedTemplate = await templateModel.findOneAndDelete({_id: id});
  
      if (!deletedTemplate) {
        return res.status(404).json({
          success: false,
          error: "Template not found!",
        });
      }
  
      return {
        success: true,
        message: "Template deleted successfully!",
      };
    } catch (error) {
      console.error("Error deleting template =>", error);
      return {
        success: false,
        error: "Something went wrong!!",
      };
    }
  };
  
export default{
    getAllTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate
}
