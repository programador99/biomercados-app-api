import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  store_id: Number,
  name: String,
  address: String,
  storeViews: Array,
  phone: String
});
export default mongoose.model('Store', storeSchema);