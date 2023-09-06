import mongoose from "mongoose";

const productMoreSellerSchema = new mongoose.Schema({
  id: Number,
  name: String,
  storeId: Number,
  brand: String,
  // products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  products: [{ type: mongoose.Schema.Types.String }],
});

export default mongoose.model('ProductMoreSeller', productMoreSellerSchema);