import mongoose from "mongoose";

const legalSchema = new mongoose.Schema({
  id: Number,
  key: String
});

export default mongoose.model('Legal', legalSchema);