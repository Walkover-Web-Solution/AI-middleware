import mongoose from "mongoose";
const ApikeyCredentials = new mongoose.Schema({
    org_id: {
        type: String,
        default: ""
    },
    name: {
        type: String,
        default: ""
    },
    service: {
        type: String,
        default: ""
    },
    apikey: {
        type: String,
        default: ""
    },
    comment: {
        type: String,
        default: ""
    },
    folder_id: {
        type: String,
        default: ""
    },
    user_id: {
        type: String,
        default: ""
    }
});
ApikeyCredentials.index({name: 1, org_id: 1}, {unique: true})
const ApikeyCredential = mongoose.model("ApikeyCredentials", ApikeyCredentials);
export default ApikeyCredential;