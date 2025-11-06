import mongoose from "mongoose";

const ignoreUserSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    org_id: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        default: "Has active bridges"
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update the updated_at field before saving
ignoreUserSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const IgnoreUserModel = mongoose.model("ignoreuser", ignoreUserSchema);
export default IgnoreUserModel;
