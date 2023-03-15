import mongoose from "mongoose";

const refreshToken = new mongoose.Schema({
  token: String,
  email: String,
  timestamp: String,
  biometric: Boolean,
  deviceId: String
});

export default mongoose.model('RefreshToken', refreshToken);
