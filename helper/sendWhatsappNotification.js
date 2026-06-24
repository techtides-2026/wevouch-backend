const express = require('express');
const app = express();

var request = require("request");
var CronJob = require('cron').CronJob;
var accessToken = "";

//cron job for accestoken generation of whatsapp api
function generateAccessToken() {
    var options = {
        'method': 'POST',
        'url': 'https://whatsappapi.engagely.ai/api/auth/login',
        'headers': {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "email": "wevouch_chatbot@wevouch.in",
            "password": "RczqE@O7iLQW@45@334"
        })
    
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        if (response.statusCode == "504") console.log('Gate-way timeout');
        // console.log(response.body);
        accessToken = JSON.parse(response.body).data.access_token
        // console.log(accessToken, new Date().toLocaleTimeString());
    });
}
generateAccessToken();

const job = new CronJob('0 */10 * * * *', generateAccessToken);
job.start();

const sendWhatsappNotification = (req, res) => {
    var options = {
        'method': 'POST',
        'url': 'https://whatsappapi.engagely.ai/api/msg/send_template_messages',
        'headers': {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "api": "WA",
            "waid": "1d4aa0-1203-4c85-8dc3",
            "version": "v1",
            "type": "template",
            "template_name": req.template,
            "payload": {
                "from": "918017069922",
                "to": "91" + req.to,
                "components": {
                    "body": req.payload
                }
            }
        })
    };
    
    request(options, function (error, response) {
        if (error) throw new Error(error);
        // console.log('Whatsapp message response', response.body);
    });
}

module.exports = sendWhatsappNotification