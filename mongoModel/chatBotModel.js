import mongoose from "mongoose";
const {
  Schema
} = mongoose;
const ChatBotSchema = new Schema({
  config: {
    type: Object
  },
  orgId: {
    type: String
  },
  title: {
    type: String
  },
  createdBy: {
    type: String
  },
  updatedBy: {
    type: String
  },
  bridge: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'configuration', // Replace 'Configuration' with your actual model name
  }],

  // actions: [{
  //   actionIdMapping: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'Actions'
  //   },
  //   actionId: {
  //     type: String
  //   },
  //   gridId: {
  //     type: String
  //   },
  //   componentId: {
  //     type: String
  //   }
  // }],
  // frontendActions: {
  //   type: Object
  // }
}, {
  minimize: false
});

// Create the model from the schema
const ChatBotModel = mongoose.model('ChatBot', ChatBotSchema);
// export default ChatBotModel;
export default ChatBotModel;