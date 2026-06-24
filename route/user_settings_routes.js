const express = require("express");

const UserSettings = require("../models/user-settings");
const userSettingRoute = express.Router();

/**
 * Get user settings by user id
 */
userSettingRoute.get("/get-by-user/:id", async (req, res) => {
  try {
    const userSettings = await UserSettings.findOne({ user: req.params.id });
    res.send({
      error: false,
      message: 'User settings detail',
      data: userSettings
    });
  } catch (error) {
    res.status(500).send({
      error: true,
      message: 'Operation failed'
    });
  }
});

/**
 * Update user settings by user id
 */
userSettingRoute.patch("/update/:userId", async (req, res) => {
  try {
    req.body.user = req.params.userId
    const userSettings = await UserSettings.findOneAndUpdate({ user: req.params.userId }, req.body, {new: true, upsert: true});
    if (userSettings) {
      res.status(200).send({
        error: false,
        message: 'Settings updated',
        data: userSettings
      })
    } else {
      res.status(200).send({
        error: true,
        message: 'User settings not updated',
      })  
    }
    
  } catch {
    res.status(500).send({
      error: true,
      message: 'Operation failed'
    })
  }
});


module.exports = userSettingRoute;
