const express = require("express");
const request = require("request");
const TicketIssueComment = require("../models/ticket-issue-comment");
const TicketIssueCommentRoute = express.Router();

TicketIssueCommentRoute.get("/list-all", async (req, res) => {
    try {
        const TicketIssueCommentList = await TicketIssueComment.find().sort({ _id: -1 }).populate([
            {
                path: "ticketIssue",
                populate: {
                    path: "ticket",
                    select: "uniqueId"
                },
            }
        ]).limit(10);
        message = {
            error: false,
            message: "Ticket Issue list",
            data: TicketIssueCommentList,
        };
        res.status(200).send(message);
    } catch(err) {
        message = {
            error: true,
            message: "operation failed!",
            data: err,
        };
        res.status(200).send(message);
    }
});

TicketIssueCommentRoute.get("/list/:ticketIssueId", async (req, res) => {
    try {
        const TicketIssueCommentList = await TicketIssueComment.find({ ticketIssue: req.params.ticketIssueId });
        message = {
            error: false,
            message: "Ticket Issue list",
            data: TicketIssueCommentList,
        };
        res.status(200).send(message);
    } catch(err) {
        message = {
            error: true,
            message: "operation failed!",
            data: err,
        };
        res.status(200).send(message);
    }
});

TicketIssueCommentRoute.post("/create", async (req, res) => {
	try {
        const TicketIssueCommentData = new TicketIssueComment(req.body);
        const result = await TicketIssueCommentData.save();

        message = {
            error: false,
            message: "Ticket Issue Added Successfully!",
            data: result,
        };
        res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(200).send(message);
	}
});



module.exports = TicketIssueCommentRoute;