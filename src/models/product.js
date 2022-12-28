import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  sku: String,
  status: Number,
  visibility: Number,
  weight: Number,
  stores: Array,
  categories: Array,
  image: String,
  sponsored: Boolean,
  brand: Object,
  origin: Object,
  packing: Object,
  tax: Number,
  isAgeRestricted: Boolean,
  description: Object,
});

// Agregando indices de busqueda
productSchema.index({ name: 'text', sku: 'text', 'categories.name': 'text' });

export default mongoose.model('Product', productSchema);
