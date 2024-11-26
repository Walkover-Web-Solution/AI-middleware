// src/mongoModel/threadModel.js

import { Schema, model } from 'mongoose';

const threadSchema = new Schema({
    thread_id: { type: String, required: true },
    sub_thread_id: { type: String, required: true },
    display_name: { type: String, required: true },
    org_id: { type: Number, required: true }
});

// Create the model
const Thread = model('Thread', threadSchema);

export default Thread;