import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: String,
  token: String,
  deviceId: String
});

export default mongoose.model('Notification', notificationSchema);