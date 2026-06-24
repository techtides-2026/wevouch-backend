const mongoose = require("mongoose");

const UserTransactionLogSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription"
  },
  transactionId: {
    type: String,
    required: true
  },
  transactionAmount: {
    type: String,
    required: true,
  }
}, {timestamps: true});

module.exports = mongoose.model("UserTransactionLog", UserTransactionLogSchema);
