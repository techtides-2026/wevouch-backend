const express = require("express");
const mongoose = require("mongoose");
const ServiceExecutiveNotifications = require("../models/service-executive-notification");
const srvcExecnotificationRoute = express.Router();

function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

srvcExecnotificationRoute.get("/list", async (req, res) => {
  const srvcNotification = await ServiceExecutiveNotifications.find().sort({"createdDate": -1}).populate("supportExecutive");
  res.send(srvcNotification);
});

srvcExecnotificationRoute.post("/add", async (req, res) => {
  try {
    if (req.body.title && req.body.executiveId) {
      let newNotification = new ServiceExecutiveNotifications();
      const sDate = new Date();

      // Initialize new Notification object with request data
      (newNotification.title = req.body.title),
      (newNotification.description = req.body.description),
      (newNotification.createdDate = new Date(sDate.getFullYear(),sDate.getMonth(),sDate.getDate(),sDate.getHours(),sDate.getMinutes(),sDate.getSeconds(),sDate.getMilliseconds())),
      (newNotification.uniqueId = "noti_"+randomString(6, "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")),
      (newNotification.supportExecutive = mongoose.Types.ObjectId(req.body.executiveId));

      // Save new notification object to database
      newNotification.save((err) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add notification.",
          });
        } else {
          return res.status(200).send({
            message: "Notifucation added successfully.",
          });
        }
      });
    } else {
      res.status(403).send({
        message: "Title and Executive Id are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

srvcExecnotificationRoute.get("/get/:id", async (req, res) => {
  try {
    const notification = await ServiceExecutiveNotifications.findOne({ _id: req.params.id }).populate("user");
    if (notification) {
      res.status(200).send(notification);
    } else {
      res.status(404).send({
        error: "Notification doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Notification doesn't exist!" });
  }
});



srvcExecnotificationRoute.delete("/delete/:id", async (req, res) => {
  try {
    const notification = await ServiceExecutiveNotifications.findOne({ _id: req.params.id });
    if (notification) {
      await Notifications.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Notification doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Notification doesn't exist!" });
  }
});

srvcExecnotificationRoute.get("/get-by-service-executive-user/:id", async (req, res) => {
    try {
      const notificationList = await ServiceExecutiveNotifications.find({ supportExecutive: req.params.id });
        res.status(200).send(notificationList);
    } catch {
      res.status(404);
      res.send({ error: "Notification doesn't exist!" });
    }
  });

module.exports = srvcExecnotificationRoute;
