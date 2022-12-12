import mongoose from "mongoose";

const paymentBank = new mongoose.Schema({
    code: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    banks: [{
      rif: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      accountno: {
        type: String,
        required: true
      },
      account_type: {
        type: String,
        required: true
      },
      store_view: {
        type: String,
        required: true
      },
      phone: {
        type: String,
        required: false
      }
    }],
  currency: {
    type: Number,
    required: false
  }
});

export default mongoose.model('PaymentAccount', paymentBank);
