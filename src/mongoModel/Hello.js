import mongoose from 'mongoose';

const helloSchema = new mongoose.Schema({
  thread_id: { type: String, required: true },
  slugname: { type: String, required: true },
  client_id: { type: String, required: true },
  org_id: { type: String, required: true },
});

// Create the model
const Hello = mongoose.model('Hello', helloSchema);

export default Hello;
