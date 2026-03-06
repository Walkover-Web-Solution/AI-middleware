import mongoose from "mongoose";

const richUiTemplateSchema = new mongoose.Schema(
  {
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
    // default_json: flat key→value map used as fallback when AI data is missing a key
    // e.g. { "subTotal": "N/A", "total": "N/A", "items": [] }
    default_json: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // ui: The fully replaced/rendered structural JSON (ready to render)
    ui: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // variables: the raw data used for replacement
    variables: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // default_values: deprecated in favor of default_json, but kept as alias for now if needed
    default_values: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    created_by: {
      type: String,
      required: true
    },
    updated_by: {
      type: String
    },
    org_id: {
      type: String,
      required: true
    },
    is_public: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

richUiTemplateSchema.index({ name: 1 });

const RichUiTemplate = mongoose.model("RichUiTemplate", richUiTemplateSchema, "rich_ui_templates");

export default RichUiTemplate;
