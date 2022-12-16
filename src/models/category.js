import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    id: Number,
    name: String,
    image: String,
    gallery_image: String,
    isParent: Boolean,
    parent_id: Number,
    isAgeRestricted: Boolean
});

export default mongoose.model('Category', categorySchema);
