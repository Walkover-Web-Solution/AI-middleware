import mongoose from 'mongoose';

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
  components: {
    type: Map,
    of: Object,
  },
  coordinates: {
    type: Map,
    of: Object,
  },
  accessType: {
    type: String,
  },
  responseTypes: {
    
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
const ChatBotModal = mongoose.model('ChatBot', ChatBotSchema);
export default ChatBotModal;
