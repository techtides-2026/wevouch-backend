const mongoose = require("mongoose");

const TicketIssueSchema = mongoose.Schema({
    ticket:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ticket",
        required: true,
    },
    comment:{
        type: String,
        required: true
    },
    resolved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("TicketIssue", TicketIssueSchema);
