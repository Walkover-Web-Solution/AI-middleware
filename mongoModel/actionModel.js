const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the schema for individual actions
const ActionDetailSchema = new Schema({
    type: {
        type: String,
    },
    scriptId: {
        type: String,
    },
    eventType: {
        type: String,
    },
    apiKey: {
        type: String,
    },
    prompt: {
        type: String,
    },
    url: {
        type: String,
    },
    // You can add more fields here if needed
});
// Define the main schema for the 'actions' collection

const ResponseDetailSchema = new Schema({
    responseId: {
        type: String,
    },
    description: {
        type: String,
    },
    components: {
        type: Object,
    },
});

const ActionSchema = new Schema({
    chatBotId: {
        type: String,
        required: true,
    },
    componentId: {
        type: String,
    },
    gridId: {
        type: String,
    },
    type: {
        type: String,
    },
    actionsArr: [ActionDetailSchema], // Array of action details
});

// Create the model from the schema
const ActionModel = mongoose.model('Actions', ActionSchema);
module.exports = ActionModel;

