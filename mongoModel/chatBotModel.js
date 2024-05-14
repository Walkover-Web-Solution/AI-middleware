const mongoose = require('mongoose');

const { Schema } = mongoose;

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
      components: {},
      coordinates: {}
    }
  },
  bridges: {
    type: Object,
    // bridgeName: {
    // id: 'asd',
    // responseIds = ['asd', 'asd'],
    // }
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
