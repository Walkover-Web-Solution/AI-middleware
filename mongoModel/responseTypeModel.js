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

const ResponseTypeSchema = new Schema({
    responseTypes: {
        type: Map,
        of: ReponseMappingSchema,
    },
    orgId: {
        type: Number,
    },
});

module.exports = mongoose.model('ResposneType', ResponseTypeSchema);