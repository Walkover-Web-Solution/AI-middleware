import mongoose from "mongoose";

const richUiTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    json_schema: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    template_format: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    html: {
        type: String,
        required: true
    },
    created_by: {
        type: String,
        required: true
    },
    updated_by: {
        type: String,
    }
}, {
    timestamps: true
});

// Indexes for better query performance
richUiTemplateSchema.index({ name: 1 });

const RichUiTemplate = mongoose.model("RichUiTemplate", richUiTemplateSchema, "rich_ui_templates");

export default RichUiTemplate;
