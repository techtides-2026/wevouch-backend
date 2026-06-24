const express = require("express");
const mongoose = require("mongoose");
const PushNotifications = require("../models/fcm_reg_token");
const OnesignalUser = require("../models/onesignal_user");
const onesignalPushNotificationRoute = express.Router();
const moment = require("moment");
const e = require("express");

onesignalPushNotificationRoute.get("/all-user-list", async (req, res) => {
  try {
    const userData = await OnesignalUser.find({}).populate([{path: "user", select: "name email mobile"}]).sort({_id: -1});
    let user = JSON.parse(JSON.stringify(userData));
    user.map(e => {
      e.timestamp =  moment(e?.createdAt).format('DD-MMM-YYYY, h:mm:ss a');
      e.updateTimestamp =  moment(e?.updatedAt).format('DD-MMM-YYYY, h:mm:ss a');
      return e;
    })
    res.status(200).send({
      error: false,
      message: "onesignal users",
      data: user
    })
  } catch (error) {
    res.status(200).send({
      error: true,
      message: String(error)
    })
  }
});

onesignalPushNotificationRoute.get("/no-user-list", async (req, res) => {
  try {
    const userData = await OnesignalUser.find({}).populate([{path: "user", select: "name email mobile"}]).sort({_id: -1});
    let user = JSON.parse(JSON.stringify(userData));
    user.map(e => {
      e.timestamp =  moment(e?.createdAt).format('DD-MMM-YYYY, h:mm:ss a');
      e.updateTimestamp =  moment(e?.updatedAt).format('DD-MMM-YYYY, h:mm:ss a');
      return e;
    })
    res.status(200).send({
      error: false,
      message: "onesignal users",
      data: user.filter(e => !e.user || e.user == null)
    })
  } catch (error) {
    res.status(200).send({
      error: true,
      message: String(error)
    })
  }
});

onesignalPushNotificationRoute.post("/send", async (req, res) => {
  try {
    if (req.body.token && req.body.notification) {
      //
      var onesignalOptions = {
        'method': 'POST',
        'url': 'https://onesignal.com/api/v1/notifications',
        'headers': {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "app_id": "37ee6ce1-016c-4993-b2b9-3d83669b0cb3",
          "contents": req.body.deviceType,
          "headings": req.body.fcmToken,
          "include_player_ids": req.body.playerIds
        })
      
      };
      request(onesignalOptions, async function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        if (response.body.success == true) {
          const onesignalUserData = await OnesignalUsers.findOneAndUpdate({$or: [{user: checkUserVerifyTime._id}, {uuid: req.body.uuid}]}, {user: checkUserVerifyTime._id, uuid: req.body.uuid, fcmToken: req.body.fcmToken, onesignalPlayerId: response.body.id}, {upsert: true, new: true})
        }
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


module.exports = onesignalPushNotificationRoute;
