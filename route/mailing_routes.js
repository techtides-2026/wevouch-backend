const express = require("express");

const mailingRoute = express.Router();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// These id's and secrets should come from .env file.
const FROM_EMAIL = process.env.FROM_EMAIL;
const CLIENT_ID = process.env.CLIENT_ID;
const CLEINT_SECRET = process.env.CLEINT_SECRET; 
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.OAUTH_REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLEINT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

mailingRoute.post("/send", async (req, res) => {
    try {
        if (req.body.email && req.body.subject && req.body.text && req.body.html) {
            const accessToken = await oAuth2Client.getAccessToken();
    
            const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: FROM_EMAIL,
                clientId: CLIENT_ID,
                clientSecret: CLEINT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken,
            },
            });
        
            const mailOptions = {
                from: FROM_EMAIL,
                to: req.body.email,
                subject: req.body.subject,
                text: req.body.text,
                html: req.body.html
            };
        
            const result = await transport.sendMail(mailOptions);
            message = {
                error: false,
                message: "Email sent successfully",
                data: result
            }
        } else {
            message = {
                error: true,
                message: "All fields are required"
            }
        }
    } catch (error) {
        message = {
            error: true,
            message: "Operation failed",
            data: error
        }
    }
    res.send(message);
});

module.exports = mailingRoute;