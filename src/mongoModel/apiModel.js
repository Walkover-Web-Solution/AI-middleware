import mongoose from "mongoose";
const apiSave = new mongoose.Schema({
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
    } 
});
const apiSaveModel = mongoose.model("apisave", apiSave);
export default apiSaveModel;