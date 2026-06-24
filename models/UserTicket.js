const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const ObjectIdType = mongoose.Schema.Types.ObjectId;

const UserTicketSchema = new Schema({
  user: {
    type: ObjectIdType,
    ref: "users"
  },
  totalTicket: {
    type: Number,
    default: 0
  },
  purchasedTicket: {
    type: Number,
    default: 0
  },
  usedTicket: {
    type: Number,
    default: 0
  },
  remainingTicket: {
    type: Number,
    default: 0
  },
  currentTicketPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ticketPackages"
  },
  previousTicketPackage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ticketPackages"
  }
}, {timestamps: true})

const UserTickets = mongoose.model('user_tickets', UserTicketSchema);
module.exports = UserTickets;
