import {
    createTemplate,
    getTemplates,
    updateTemplate,
    deleteTemplate
} from "../db_services/richUiTemplate.service.js";
import { generateSchemaFromCard } from "../utils/Formatter.utility.js";

// Create a new rich UI template
export const createRichUiTemplate = async (req, res, next) => {
    try {
        const { name, description, json_schema, template_format, html } = req.body;
        const { user: { id: user_id }, org_id } = req.profile;

        if (!name || !description || !template_format || !html) {
            res.locals = { success: false, message: "Missing required fields" };
            req.statusCode = 400;
            return next();
        }

        const schema = json_schema || generateSchemaFromCard(template_format).schema;

        const result = await createTemplate({
            name,
            description,
            json_schema: schema,
            template_format,
            html,
            org_id
        }, user_id);

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
        const { org_id } = req.profile;
        
        res.locals = await getTemplates(org_id);
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
        const { user: { id: user_id } } = req.profile;
        const allowedFields = ['name', 'description', 'json_schema', 'template_format', 'html'];

        const updateData = Object.fromEntries(
            Object.entries(req.body)
                .filter(([key, value]) => allowedFields.includes(key) && value != null)
        );

        res.locals = await updateTemplate(template_id, updateData, user_id);
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
        const { user: { id: user_id } } = req.profile;

        res.locals = await deleteTemplate(template_id, user_id);
        req.statusCode = 200;
        return next();
    } catch (error) {
        res.locals = { success: false, message: error.message };
        req.statusCode = 500;
        return next();
    }
};



