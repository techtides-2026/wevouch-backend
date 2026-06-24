const express = require('express');
const app = express();

const Notification = require('../models/notification');

const sendNotification = async (req, res) => {
    const user = req.userId
    const title = req.title
    const description = req.desc
    const createdDate = new Date();
    const notificationData = new Notification({user, title, description, createdDate})
    const result = await notificationData.save();
    // const result = await Notification.find({user: user});
    return result
}

module.exports = sendNotification