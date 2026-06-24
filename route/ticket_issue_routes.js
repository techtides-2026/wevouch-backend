const express = require("express");
const request = require("request");
const TicketIssue = require("../models/ticket-issue");
const TicketIssueRoute = express.Router();

TicketIssueRoute.get("/list-all", async (req, res) => {
    try {
        const TicketIssueList = await TicketIssue.find({}).sort({ _id: -1 }).populate([
            {
				path: "ticket",
				populate: [
					{
						path: "products",
						select: "name productImagesUrl"
					},
					{
						path: "users",
						select: "name mobile"
					}
				]
            }
        ]);
        message = {
            error: false,
            message: "Ticket Issue list",
            data: TicketIssueList.filter(e => e.ticket && e.ticket?.users && e.ticket?.products),
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

TicketIssueRoute.get("/unresolved-list", async (req, res) => {
    try {
        let TicketIssueList = await TicketIssue.find({resolved: false}).sort({ _id: -1 }).populate([
            {
				path: "ticket",
				populate: [
					{
						path: "products",
						select: "name productImagesUrl"
					},
					{
						path: "users",
						select: "name mobile"
					}
				]
            }
        ]);
		if (req.query.executive) {
			TicketIssueList = TicketIssueList.filter(e => e.ticket && e.ticket?.executive == req.query.executive)
		}
        message = {
            error: false,
            message: "Ticket Issue list",
            data: TicketIssueList.filter(e => e.ticket && e.ticket?.users && e.ticket?.products),
        };
        res.status(200).send(message);
    } catch(err) {
        message = {
            error: true,
            message: "operation failed!",
            data: String(err),
        };
        res.status(200).send(message);
    }
});

TicketIssueRoute.get("/list/:ticketId", async (req, res) => {
    try {
        const TicketIssueList = await TicketIssue.find({ ticket: req.params.ticketId });
        message = {
            error: false,
            message: "Ticket Issue list",
            data: TicketIssueList,
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

TicketIssueRoute.post("/create", async (req, res) => {
	try {
        const TicketIssueData = new TicketIssue(req.body);
        const result = await TicketIssueData.save();

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

TicketIssueRoute.get("/detail/:TicketIssueId", async (req, res) => {
	try {
		const TicketIssueData = await TicketIssue.findOne({ _id: req.params.TicketIssueId });
		if (TicketIssueData.length != 0) {
			message = {
				error: false,
				message: "Ticket Issue Data Found!",
				data: TicketIssueData,
			};
		} else {
			message = {
				error: true,
				message: "No Data Found!",
			};
		}
		res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Ticket Issue not found!",
			data: err,
		};
		res.status(200).send(message);
	}
});

TicketIssueRoute.patch("/update/:TicketIssueId", async (req, res) => {
	try {
 
		const result = await TicketIssue.findOneAndUpdate({ _id: req.params.TicketIssueId }, req.body, {new: true});
		message = {
			error: false,
			message: "Ticket Issue Updated Successfully!"
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

TicketIssueRoute.patch("/toggle-resolve/:TicketIssueId", async (req, res) => {
	try {
 
		const result = await TicketIssue.updateOne({ _id: req.params.TicketIssueId }, {resolved: req.body.resolved});

		message = {
			error: false,
			message: "Ticket Issue resolved!"
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

TicketIssueRoute.delete("/delete/:TicketIssueId", async (req, res) => {
	try {
		const result = await TicketIssue.deleteOne({ _id: req.params.TicketIssueId });
		if (result.deletedCount == 1) {
			message = {
				error: false,
				message: "Ticket Issue deleted successfully!",
			};
			res.status(200).send(message);
		} else {
			message = {
				error: true,
				message: "Operation failed!",
			};
			res.status(200).send(message);
		}
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(200).send(message);
	}
});


module.exports = TicketIssueRoute;