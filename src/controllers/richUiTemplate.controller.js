import {
    createTemplate,
    getTemplates,
    updateTemplate,
    deleteTemplate
} from "../db_services/richUiTemplate.service.js";

// Create a new rich UI template
export const createRichUiTemplate = async (req, res, next) => {
    try {
        const { name, description, json_schema, template_format, html } = req.body;
        const user_id = req.profile.user.id;

        // Validation
        if (!name || !json_schema || !template_format || !html) {
            res.locals = {
                success: false,
                message: "Name, json_schema, template_format, and html are required fields"
            };
            req.statusCode = 400;
            return next();
        }

        const templateData = {
            name,
            description,
            json_schema,
            template_format,
            html
        };

        const result = await createTemplate(templateData, user_id);
        
        res.locals = result;
        req.statusCode = 201;
        return next();
    } catch (error) {
        res.locals = { success: false, message: error.message };
        req.statusCode = 500;
        return next();
    }
};

// Get all templates
export const getRichUiTemplates = async (req, res, next) => {
    try {
        const result = await getTemplates();

        res.locals = result;
        req.statusCode = 200;
        return next();
    } catch (error) {
        res.locals = { success: false, message: error.message };
        req.statusCode = 500;
        return next();
    }
};


// Update a template
export const updateRichUiTemplate = async (req, res, next) => {
    try {
        const { template_id } = req.params;
        const user_id = req.profile.user.id;
        const updateData = req.body;

        if (!template_id) {
            res.locals = {
                success: false,
                message: "Template ID is required"
            };
            req.statusCode = 400;
            return next();
        }

        // Remove fields that shouldn't be updated directly
        delete updateData.created_by;
        delete updateData.createdAt;
        
        const result = await updateTemplate(template_id, updateData, user_id);
        
        res.locals = result;
        req.statusCode = 200;
        return next();
    } catch (error) {
        res.locals = { success: false, message: error.message };
        req.statusCode = 500;
        return next();
    }
};

// Delete a template
export const deleteRichUiTemplate = async (req, res, next) => {
    try {
        const { template_id } = req.params;
        const user_id = req.profile.user.id;

        if (!template_id) {
            res.locals = {
                success: false,
                message: "Template ID is required"
            };
            req.statusCode = 400;
            return next();
        }

        const result = await deleteTemplate(template_id, user_id);
        
        res.locals = result;
        req.statusCode = 200;
        return next();
    } catch (error) {
        res.locals = { success: false, message: error.message };
        req.statusCode = 500;
        return next();
    }
};



