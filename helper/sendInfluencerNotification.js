const express = require('express');
const app = express();

const InfluencerNotification = require('../models/influencer-notification');

const sendInfluencerNotification = async (req, res) => {
    const user = req.user;
    const influencer = req.influencer;
    const title = req.title;
    const description = req.description;
    console.log("req.description", req.description);
    let InfluencerNotificationData;
    if (user) {
        InfluencerNotificationData = new InfluencerNotification({user, influencer, title, description});
    } else {
        InfluencerNotificationData = new InfluencerNotification({influencer, title, description});
    }

    const result = await InfluencerNotificationData.save();
    return result
}

module.exports = sendInfluencerNotification