const mongoose = require("mongoose");

const TicketLogSchema = mongoose.Schema({
  executive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SupportExecutive",
    required: false,
  },
  comment:{
    type: String,
    required: true
  },
  logType:{
    type: String,
    required: false
  },
  ticket:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ticket",
    required: true,
  },
  userApproval: {
    type: Boolean,
    default: false
  },
  approved: {
    type: Boolean
  },
  approvalQuestion: {
    type: String
  },
  activeLog: {
    type:Boolean,
    default: false
  },
  createdAt:{
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model("TicketLog", TicketLogSchema);
