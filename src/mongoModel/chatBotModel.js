import mongoose from "mongoose";
const {
  Schema
} = mongoose;
const ChatBotSchema = new Schema({
  config: {
    type: Object,
    default: {
      buttonName: '',
      height: '100',
      heightUnit: '%',
      width: '50',
      widthUnit: '%',
      type: 'popup',
      themeColor: "#000000"
    }
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
    type: String,
    default: "chatbot"
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