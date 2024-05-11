import mongoose from 'mongoose';

const { Schema } = mongoose;

const InterfaceSchema = new Schema({
  config: {
    type: Object,
  },
  orgId: {
    type: String,
  },
  projectId: {
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
const InterfaceModel = mongoose.model('Interfaces', InterfaceSchema);
export default InterfaceModel;
