const mongoose = require("mongoose");

const SubscritptionSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  ticketCount: {
    type: Number,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Subscription", SubscritptionSchema);
