const express = require("express");
const mongoose = require("mongoose");
const PushNotifications = require("../models/fcm_reg_token");
const pushNotificationRoute = express.Router();

var admin = require("firebase-admin");

var serviceAccount = require("../wevouch-e80e0-firebase-adminsdk-sth0v-53bc0860d8.json");
// var serviceAccount = require("../fcms/wevouch-ga-firebase-adminsdk-8hdu8-f33cd19954.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://wevouch-e80e0-default-rtdb.firebaseio.com"
  // databaseURL: "https://wevouch-ga-default-rtdb.firebaseio.com"
}, "your-unique-name");

pushNotificationRoute.get("/list", async (req, res) => {
  const Pushnotifications = await PushNotifications.find();
  res.send(Pushnotifications);
});

pushNotificationRoute.post("/send", async (req, res) => {
  try {
    if (req.body.token && req.body.notification) {
      let registrationToken = req.body.token;

      let message = {
        notification: req.body.notification,
        token: registrationToken
      };
      
      // Send a message to the device corresponding to the provided
      // registration token.
      admin.messaging().send(message)
      .then((response) => {
          // Response is a message ID string.
          return res.status(200).send({
              error: false,
              message: "Successfully sent message.",
              data: response.toString()
          });
          // console.log('Successfully sent message:', response);
      })
      .catch((error) => {
          return res.status(200).send({
              error: true,
              message: "Error sending message.",
              data: error.toString()
          });
          // console.log('Error sending message:', error);
      });
    } else {
        res.status(200).send({
            error: true,
            message: "Token, notification and User are required.",
        });
    }
  } catch (error) {
    res.status(200).send({
        error: true,
        message: error.toString(),
    });
  }
});

module.exports = pushNotificationRoute;
