const mongoose = require("mongoose");

const TicketPackageSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
  },
  amount: {
    type: Number,
    required: true
  },
  ticketCount: {
    type: Number,
    required: true
  },
  status: {
    type: Boolean,
    default: true
  },
  expiryDate: {
    type: Date
  },
}, {timestamps: true});

module.exports = mongoose.model("ticketPackages", TicketPackageSchema);
