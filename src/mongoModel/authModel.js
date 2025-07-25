import mongoose from "mongoose";
const AuthSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    org_id: {
        type: String,
        required: true
    },
    redirection_url: {
        type: String,
        required: true
    },
    client_id: {
        type: String,
        required: true
    }
});

AuthSchema.index({ org_id: 1, client_id: 1 }, { unique: true });
const Auth = mongoose.model("auth", AuthSchema);
export default Auth;