const express = require("express");
const mongoose = require("mongoose");
const Notifications = require("../models/notification");
const notificationRoute = express.Router();

function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

notificationRoute.get("/list", async (req, res) => {
  const notifications = await Notifications.find().sort({"createdDate": -1}).populate("user");
  res.send(notifications);
});

notificationRoute.post("/add", async (req, res) => {
  try {
    if (req.body.title && req.body.userId) {
      let newNotification = new Notifications();
      const sDate = new Date();

      // Initialize new Notification object with request data
      (newNotification.title = req.body.title),
      (newNotification.description = req.body.description),
      (newNotification.createdDate = new Date(sDate.getFullYear(),sDate.getMonth(),sDate.getDate(),sDate.getHours(),sDate.getMinutes(),sDate.getSeconds(),sDate.getMilliseconds())),
      (newNotification.uniqueId = "noti_"+randomString(6, "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")),
      (newNotification.user = mongoose.Types.ObjectId(req.body.userId));

      // Save new notification object to database
      newNotification.save((err, data) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add notification.",
          });
        } else {
          return res.status(200).send({
            message: "Notifucation added successfully.",
            notificationId: data._id 
          });
        }
      });
    } else {
      res.status(403).send({
        message: "Title and User Id are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

notificationRoute.get("/get/:id", async (req, res) => {
  try {
    const notification =  await Notifications.findOne({ _id: req.params.id }).populate("user");
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

notificationRoute.delete("/delete/:id", async (req, res) => {
  try {
    const notification = await Notifications.findOne({ _id: req.params.id });
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

notificationRoute.get("/get-by-user/:id", async (req, res) => {
  try {
    const notificationList = await Notifications.find({ user: req.params.id });
      res.status(200).send(notificationList);
  } catch {
    res.status(404);
    res.send({ error: "Notification doesn't exist!" });
  }
});

notificationRoute.get("/get-by-user-last-10/:id", async (req, res) => {
  try {
    const notificationList = await Notifications.find({ user: req.params.id, status: true}).sort({_id: -1}).limit(10);
      res.status(200).send(notificationList);
  } catch {
    res.status(404);
    res.send({ error: "Notification doesn't exist!" });
  }
});

//dt 27-03-2022
notificationRoute.get("/get-by-user-id/:id", async (req, res) => {
  try {
    const notificationList = await Notifications.find({ user: req.params.id }).sort({_id: -1});
      res.status(200).send({
        error: false,
        message: 'User notifications',
        data: notificationList
      });
  } catch {
    res.status(404);
    res.send({ error: true, message: "Notification doesn't exist!" });
  }
});


notificationRoute.post("/notification-status-change", async (req, res) => {
  try {
    if(req.body.notificationId !== '') {
      console.log('hello');
      const result = await Notifications.updateOne({ _id: req.body.notificationId }, {status: req.body.status});
    } else {
      const result = await Notifications.updateMany({ user: req.body.userId }, {status: req.body.status});
    }
		const notificationList = await Notifications.find({ user: req.body.userId });
		message = {
			error: false,
			message: "All notification status updated",
      data: notificationList
		};
		res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(400).send(message);
	}
})

notificationRoute.post("/notification-clear", async (req, res) => {
  try {
    if(req.body.notificationId !== '') {
      console.log('hello');
      const result = await Notifications.updateOne({ _id: req.body.notificationId }, {cleared: req.body.cleared});
    } else {
      const result = await Notifications.updateMany({ user: req.body.userId }, {cleared: req.body.cleared});
    }
		// const notificationList = await Notifications.find({ user: req.body.userId });
		message = {
			error: false,
			message: "Notification cleared"
		};
		res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(400).send(message);
	}
})



module.exports = notificationRoute;
