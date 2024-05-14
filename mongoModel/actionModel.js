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

const BridgeMappingSchema = new Schema({
    bridgeId: {
        type: String,
    },
    defaultQuestions: {
        type: Array,
    },
}, { _id: false });

const ActionSchema = new Schema({
    interfaceId: {
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

    actionsArr: [ActionDetailSchema], // Array of action details
    responseArr: [ResponseDetailSchema],
});

// Create the model from the schema
const ActionModel = mongoose.model('Actions', ActionSchema);
module.exports = ActionModel;

