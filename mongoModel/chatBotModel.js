const mongoose = require('mongoose');

const { Schema } = mongoose;

const BridgeMappingSchema = new Schema({
  bridgeId: {
    type: String,
  },
  defaultQuestions: {
    type: Array,
  },
}, { _id: false });

const ChatBotSchema = new Schema({
  config: {
    type: Object,
  },
  orgId: {
    type: String,
  },
  title: {
    type: String,
  },
  createdBy: {
    type: String,
  },
  updatedBy: {
    type: String,
  },
  responseTypes: {
    responseId: {
      components: {
        type: Object,
      },
      coordinates: {
        type: Object,
      },
      description: {
        type: String,
      },
    }
  },
  bridge: {
    authKey: {
      type: String,
    },
    bridgeKeys: {
      type: [String],
      default: ['root'], // Set the default value to ['root']
    },
    bridgeMapping: {
      type: Map,
      of: BridgeMappingSchema,
      default: { root: { bridgeId: '', defaultQuestions: [] } },
    },
  },
  actions: [
    {
      actionIdMapping: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Actions',
      },
      actionId: {
        type: String,
      },
      gridId: {
        type: String,
      },
      componentId: {
        type: String,
      },
    },
  ],
  frontendActions: {
    type: Object,
  },
}, { strict: false, minimize: false });

// Create the model from the schema
const ChatBotModel = mongoose.model('ChatBot', ChatBotSchema);
// export default ChatBotModel;
module.exports = ChatBotModel;
