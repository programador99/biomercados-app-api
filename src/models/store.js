import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  store_id: Number,
  storeViews: Array
});
module.exports = mongoose.model('Store', storeSchema);