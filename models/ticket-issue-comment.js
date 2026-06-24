const mongoose = require("mongoose");

const TicketIssueCommentSchema = mongoose.Schema({
    ticketIssue:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "TicketIssue",
        required: true,
    },
    comment:{
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("TicketIssueComment", TicketIssueCommentSchema);
