// create mongoose schema for organization which has title, description, meta, created_at, updated_at
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReponseMappingSchema = new Schema({
    components: {
        type: Object,
    },
    coordinates: {
        type: Object,
    },
    description: {
        type: String,
    },
}, { _id: false });

const OrgSchema = new Schema({
    title: { type: String },
    description: { type: String },
    meta: {
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        responseTypes: {
            type: Map,
            of: ReponseMappingSchema,
        },
    }
});

module.exports = mongoose.model('Organization', OrgSchema);