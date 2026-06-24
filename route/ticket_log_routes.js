const express = require("express");
const mongoose = require("mongoose");
const TicketLog = require("../models/ticket-log");
const Notifications = require("../models/notification");
const Tickets = require("../models/tickets");
const ticketLogRoute = express.Router();

function randomString(length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
ticketLogRoute.get("/list", async (req, res) => {
  const ticketLogs = await TicketLog.find().sort({ createdAt: -1 });
  res.send(ticketLogs);
});

ticketLogRoute.post("/add", async (req, res) => {
  try {
    if (req.body.comment && req.body.executiveId && req.body.ticketId) {
      let newTicketLog = new TicketLog();

      // Initialize new Ticket Log object with request data
      (newTicketLog.comment = req.body.comment),
      (newTicketLog.logType = req.body.logType),
        ((newTicketLog.executive = mongoose.Types.ObjectId(
          req.body.executiveId
        )),
        (newTicketLog.ticket = mongoose.Types.ObjectId(req.body.ticketId)));
        (newTicketLog.userApproval = req.body.userApproval);
        (newTicketLog.approvalQuestion = req.body.approvalQuestion);
      const sDate = new Date();
      newTicketLog.createdAt = new Date(
        sDate.getFullYear(),
        sDate.getMonth(),
        sDate.getDate(),
        sDate.getHours(),
        sDate.getMinutes(),
        sDate.getSeconds(),
        sDate.getMilliseconds()
      );
      // Save new Ticket Log object to database
      newTicketLog.save((err) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add ticket og.",
          });
        } else {
          const sDate = new Date();
          let newNotification = new Notifications();
          Tickets.findOne(
            { _id: req.body.ticketId },
            (getErr, ticketDetails) => {
              if (getErr) {
                return res.status(200).send({
                  message: "Ticket Log added successfully.",
                });
              }
              let title = 'A new log added to ticket';
              if(req.body.title || req.body.title != ''){
                title = req.body.title;
              }
              // Initialize new Notification object with request data
              (newNotification.title = title),
                (newNotification.description = req.body.comment),
                (newNotification.createdDate = new Date(
                  sDate.getFullYear(),
                  sDate.getMonth(),
                  sDate.getDate(),
                  sDate.getHours(),
                  sDate.getMinutes(),
                  sDate.getSeconds(),
                  sDate.getMilliseconds()
                )),
                (newNotification.uniqueId =
                  "noti_" +
                  randomString(
                    6,
                    "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
                  )),
                (newNotification.user = mongoose.Types.ObjectId(
                  ticketDetails.users
                ));
              newNotification.save();
              return res.status(200).send({
                message: "Ticket Log added successfully.",
              });
            }
          );
        }
      });
    } else {
      res.status(403).send({
        message: "Ticket Id, Executive Id and Comment are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

ticketLogRoute.get("/get/:id", async (req, res) => {
  try {
    const ticketLog = await TicketLog.findOne({ _id: req.params.id });
    if (ticketLog) {
      res.status(200).send(ticketLog);
    } else {
      res.status(404).send({
        error: "Ticket Log doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Ticket Log doesn't exist!" });
  }
});

ticketLogRoute.patch("/user-approval/:id", async (req, res) => {
  try {
    const ticketLog = await TicketLog.findOneAndUpdate({ _id: req.params.id }, {approved: req.body.approved}, {new: true});
    if (ticketLog) {
      res.status(200).send({
        error: false,
        message: 'Approval status changed by',
        data: ticketLog
      });
    } else {
      res.status(200).send({
        error: true,
        message: "User approval not changed!",
      });
    }
  } catch {
    res.status(200);
    res.send({ 
      error: true,
      message: "Operation failed!" 
    });
  }
});

ticketLogRoute.patch("/update-comment/:id", async (req, res) => {
  try {
    const ticketLog = await TicketLog.findOneAndUpdate({ _id: req.params.id }, {comment: req.body.comment}, {new: true});
    if (ticketLog) {
      res.status(200).send({
        error: false,
        message: 'comment changed',
        data: ticketLog
      });
    } else {
      res.status(200).send({
        error: true,
        message: "comment not changed!",
      });
    }
  } catch {
    res.status(200);
    res.send({ 
      error: true,
      message: "Operation failed!" 
    });
  }
});

ticketLogRoute.patch("/activate-log/:id", async (req, res) => {
  try {
    const ticketLog = await TicketLog.findOneAndUpdate({ _id: req.params.id }, {activeLog: req.body.activeLog}, {new: true});
    if (ticketLog) {
      res.status(200).send({
        error: false,
        message: 'active Log status changed',
        data: ticketLog
      });
    } else {
      res.status(200).send({
        error: true,
        message: "active Log status not changed!",
      });
    }
  } catch {
    res.status(200);
    res.send({ 
      error: true,
      message: "Operation failed!" 
    });
  }
});

ticketLogRoute.get("/get-by-ticket/:id", async (req, res) => {
  try {
    const ticketLogList = await TicketLog.find({ ticket: req.params.id })
      .populate("ticket executive");
    res.status(200).send(ticketLogList);
  } catch {
    res.status(404);
    res.send({ error: "Product doesn't exist!" });
  }
});

ticketLogRoute.get("/get-by-executive/:id", async (req, res) => {
  try {
    const ticketLogList = await TicketLog.find({ executive: req.params.id })
      .sort({ createdAt: -1 })
      .populate("ticket executive");
    res.status(200).send(ticketLogList);
  } catch {
    res.status(404);
    res.send({ error: "Product doesn't exist!" });
  }
});

ticketLogRoute.delete("/delete/:id", async (req, res) => {
  try {
    const ticketLog = await TicketLog.findOne({ _id: req.params.id });
    if (ticketLog) {
      await TicketLog.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Ticket Log doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Ticket Log doesn't exist!" });
  }
});

module.exports = ticketLogRoute;
