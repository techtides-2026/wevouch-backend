const express = require("express");
const whatsappRoute = express.Router();
const sendWhatsappNotification = require("../helper/sendWhatsappNotification")

whatsappRoute.post("/send", async(req, res) => {
    var result = sendWhatsappNotification(req.body)
    res.send(result)
    console.log('result', result);
})
module.exports = whatsappRoute;