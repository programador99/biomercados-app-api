import mongoose from "mongoose";

const userSearchSchema = new mongoose.Schema({
  userId: String,
  searches: Array,
});

module.exports = mongoose.model('UserSearch', userSearchSchema);