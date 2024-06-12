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
  type: {
    type: String
  },
  updatedBy: {
    type: String
  },
  bridge: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'configuration', // Replace 'Configuration' with your actual model name
  }],
}, {
  minimize: false
});

// Create the model from the schema
const ChatBotModel = mongoose.model('ChatBot', ChatBotSchema);
// export default ChatBotModel;
export default ChatBotModel;