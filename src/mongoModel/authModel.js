import mongoose from "mongoose";
const AuthSchema = new mongoose.Schema({
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

const Auth = mongoose.model("auth", AuthSchema);
export default Auth;