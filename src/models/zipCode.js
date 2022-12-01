import mongoose from "mongoose";

const zipCode = new mongoose.Schema({
  dest_region_id: {
      type: Number,
      required: true
    },
    dest_zip: {
      type: String,
      required: true
    },
    alias: {
      type: String,
      required: true
    }
});

export default mongoose.model('zipCode', zipCode);
