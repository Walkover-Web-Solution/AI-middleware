import mongoose from "mongoose";

const ConfigurationSchema = new mongoose.Schema({
    service : {
        type : String,
        required : true
    },
    model_name : {
        type : String,
        required : true
    },
    configuration: {
      model: {
        field: { type: String },
        default: { type: String },
        level: { type: Number }
      },
      creativity_level: {
        field: { type: String },
        min: { type: Number },
        max: { type: Number },
        step: { type: Number },
        default: { type: Number },
        level: { type: Number }
      },
      max_tokens: {
        field: { type: String },
        min: { type: Number },
        max: { type: Number },
        step: { type: Number },
        default: { type: Number },
        level: { type: Number }
      },
      probability_cutoff: {
        field: { type: String },
        min: { type: Number },
        max: { type: Number },
        step: { type: Number },
        default: { type: Number },
        level: { type: Number }
      },
      log_probability: {
        field: { type: String },
        default: { type: Boolean },
        level: { type: Number },
        typeOf: { type: String }
      },
      repetition_penalty: {
        field: { type: String },
        min: { type: Number },
        max: { type: Number },
        step: { type: Number },
        default: { type: Number },
        level: { type: Number }
      },
      novelty_penalty: {
        field: { type: String },
        min: { type: Number },
        max: { type: Number },
        step: { type: Number },
        default: { type: Number },
        level: { type: Number }
      },
      response_count: {
        field: { type: String },
        default: { type: Number },
        typeOf: { type: String },
        level: { type: Number }
      },
      stop: {
        field: { type: String },
        default: { type: String },
        level: { type: Number }
      },
      stream: {
        field: { type: String },
        default: { type: Boolean },
        level: { type: Number },
        typeOf: { type: String }
      },
      tools: {
        field: { type: String },
        level: { type: Number },
        default: { type: Array },
        typeOf: { type: String }
      },
      tool_choice: {
        field: { type: String },
        options: { type: Array },
        default: { type: String },
        level: { type: Number },
        typeOf: { type: String }
      },
      response_type: {
        field: { type: String },
        options: { type: Array },
        default: { type: Object },
        level: { type: Number }
      },
      vision: {
        support: { type: Boolean },
        level: { type: Number },
        default: { type: Boolean }
      },
      parallel_tool_calls: {
        field: { type: String },
        default: { type: Boolean },
        level: { type: Number },
        typeOf: { type: String }
      }
    },
    outputConfig: {
      usage: [
        {
          prompt_tokens: { type: String },
          completion_tokens: { type: String },
          total_tokens: { type: String },
          cached_tokens: { type: String },
          total_cost: {
            input_cost: { type: Number },
            output_cost: { type: Number },
            cached_cost: { type: Number }
          }
        }
      ],
      message: { type: String },
      tools: { type: String },
      assistant: { type: String },
      id: { type: String }
    },
    inputConfig: {
      system: {
        role: { type: String },
        content: { type: String },
        contentKey: { type: String },
        type: { type: String }
      },
      content_location: { type: String }
    }
  });
  
ConfigurationSchema.index({ model_name: 1, service: 1 }, { unique: true });
const ModelsConfigModel = mongoose.model("modelConfiguration", ConfigurationSchema);
export default ModelsConfigModel;
