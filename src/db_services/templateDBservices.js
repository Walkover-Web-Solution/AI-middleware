import { templateModel } from "../mongoModel/template.js";
// Create a new template
const createTemplate = async ({ templateName, template, org_id }) => {
  if (!templateName || !template) {
    throw new Error('Template name and Template prompt are required!')
  }

  const newTemplate = new templateModel({
    templateName,
    template,
    org_id, 
    created_at: Date.now()
  });

  await newTemplate.save();
  return newTemplate
};
  

// Read all templates
const getAllTemplate = async (org_id)  => {
  return await templateModel.find({
        org_id: org_id
      });
  };
  


// Update a template by ID
const updateTemplate = async ({ id, templateName, template}) => {
      if (!templateName && !template) {
        throw new Error('Template name and Template prompt are required!')
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
        throw new Error('Template not found!');
      }
      return updatedTemplate
  };
  

// Delete a template by ID
const deleteTemplate = async (id) => {
      const deletedTemplate = await templateModel.findOneAndDelete({_id: id});
      if (!deletedTemplate) {
        throw new Error('Template not found!');
      }
      return {
        message: "Template deleted successfully!",
      };
  };
  
export default{
    getAllTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate
}
