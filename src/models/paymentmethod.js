import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema({
    id: Number,
    code: String,
    accountno: String
});

export default mongoose.model('PaymentMethod', paymentMethodSchema);