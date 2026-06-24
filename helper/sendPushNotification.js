const express = require("express");
const mongoose = require("mongoose");
const PushNotifications = require("../models/fcm_reg_token");
const Products = require("../models/products");
const Users = require("../models/users");
const mailSendingApi = 'http://3.136.213.9:5000/api/mail/send';
var request = require("request");

var CronJob = require('cron').CronJob;
var admin = require("firebase-admin");

var serviceAccount = require("../wevouch-e80e0-firebase-adminsdk-sth0v-53bc0860d8.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://wevouch-e80e0-default-rtdb.firebaseio.com"
});

const sendPushNotification = async(req, res) => {
    try {
        console.log('try block');
        if (req.user && req.token && req.notification) {
            console.log('If block', req);
            const userTokenPresent = await PushNotifications.findOne({ $and: [ { user: req.user}, { token: req.token}] });
            if (!userTokenPresent) {
                console.log(1, req.notification);

                let newNotification = new PushNotifications();

                // Initialize new Notification object with request data
                (newNotification.user = mongoose.Types.ObjectId(req.user));
                (newNotification.token = req.token),

                // Save new notification object to database
                newNotification.save((err) => {
                    if (err) {
                        return {
                            error: true,
                            message: "Failed to add notification.",
                        };
                    } else {
                        console.log(2, req.notification);
                        let registrationToken = req.token;
                        let message = {
                            notification: req.notification,
                            token: registrationToken
                        };
                        
                        // Send a message to the device corresponding to the provided
                        // registration token.
                        admin.messaging().send(message)
                        .then((response) => {
                            // Response is a message ID string.
                            return {
                                error: false,
                                message: "Successfully sent message.",
                                data: response
                            };
                            // console.log('Successfully sent message:', response);
                        })
                        .catch((error) => {
                            return {
                                error: true,
                                message: "Error sending message.",
                                data: error
                            };
                            // console.log('Error sending message:', error);
                        });
                    }
                });
            } else {
    
                let registrationToken = req.token;

                let message = {
                    notification: req.notification,
                    token: registrationToken
                };
                
                // Send a message to the device corresponding to the provided
                // registration token.
                admin.messaging().send(message)
                .then((response) => {
                    // Response is a message ID string.
                    console.log('Successfully sent message:', response);
                    return {
                        error: false,
                        message: "Successfully sent message.",
                        data: response
                    };
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                    return {
                        error: true,
                        message: "Error sending message.",
                        data: error
                    };
                });
            }
        } else {
            console.log('else block');
            return {
                error: true,
                message: "Token, notification and User are required.",
            };
        }
    } catch (error) {
        console.log('catch block', error);
        return {
            error: true,
            message: error,
        };
    }
};

// const job = new CronJob('00 00 10 * * *', async () => {

//     ///// warranty section ////
//     let products = await Products.find({}).sort({ _id: -1 }).populate([
//         {
//             path: "users",
//             select: "name email mobile fcmToken"
//         }
//     ]);
//     products = products.filter(e => e.purchaseDate && e.warrantyPeriod != null && e.users )
//     console.log(products);
//     for (let i = 0; i < products.length; i++) {
//         //warranty section
//         if (products[i].purchaseDate || products[i].purchaseDate != null) {
//             currDt = new Date();
//             expDt = new Date(products[i].purchaseDate);
//             expDt.setMonth(expDt.getMonth() + products[i].warrantyPeriod);
//             let diffInDays = Number((currDt-expDt)/(1000 * 60 * 60 * 24));
//             console.log(diffInDays, products[i].users?.name);


//             if (diffInDays > -2 && diffInDays <= 0) {
//                 console.log("Warranty lapsed");
//                 const result = await sendPushNotification({
//                     "user": products[i].users?._id,
//                     "token": products[i].users?.fcmToken,
//                     "notification": {
//                     "title": "Warranty lapsed",
//                     "body": "WARRANTY LAPSED! Your warranty for "+products[i]?.name+" has lapsed."
//                     }
//                 })
//             } 
//             if (diffInDays >= -4 && diffInDays <= -3) {
//                 console.log("3 Days waaranty");
//                 const result = await sendPushNotification({
//                     "user": products[i].users?._id,
//                     "token": products[i].users?.fcmToken,
//                     "notification": {
//                     "title": "Warranty Expiry 3 days",
//                     "body": "HURRY! WARRANTY EXPIRES IN 3 DAYS! Your warranty for "+products[i]?.name+" will expire on "+expDt+". Kindly extend your warranty to enjoy uninterrupted assistance to maintain your products."
//                     }
//                 })
//             } 
//             if (diffInDays >= -31 && diffInDays <= -30) {
//                 console.log("30 Days waaranty");
//                 const result = await sendPushNotification({
//                     "user": products[i].users?._id,
//                     "token": products[i].users?.fcmToken,
//                     "notification": {
//                     "title": "Warranty Expiry 30 days",
//                     "body": "WARRANTY EXPIRES IN 30 DAYS! Your warranty for "+products[i]?.name+" will expire on "+expDt+". Kindly extend your warranty before it expires."
//                     }
//                 })
//             }
//         }

//         ////extended warranty section////
        
//         ////trigger push
//         if (products[i].extendedWarranty?.startDate && products[i].extendedWarranty.noOfYears) {
//             currDt = new Date();
//             expDt = new Date(products[i].extendedWarranty?.startDate);
//             expDt.setMonth(expDt.getMonth() + (products[i].extendedWarranty.noOfYears*12));
//             let diffInDays = Number((currDt-expDt)/(1000 * 60 * 60 * 24));
            
//             console.log(diffInDays);
//             // console.log(products[i].extendedWarranty?.startDate , products[i].extendedWarranty?.noOfYears);


//             if (diffInDays > -2 && diffInDays <= 0) {
//                 console.log("Warranty lapsed");
//                 const result = await sendPushNotification({
//                     "user": products[i].users?._id,
//                     "token": products[i].users?.fcmToken,
//                     "notification": {
//                         "title": "Extended Warranty lapsed",
//                         "body": "EXTENDED WARRANTY LAPSED! Your extended warranty for "+products[i]?.name+" has lapsed."
//                     }
//                 })
//             }
//         }

//         ////trigger mail
//         if (products[i].extendedWarranty?.startDate && products[i].extendedWarranty.noOfYears && products[i].users?.email) {
//             currDt = new Date();
//             expDt = new Date(products[i].extendedWarranty?.startDate);
//             expDt.setMonth(expDt.getMonth() + (products[i].extendedWarranty.noOfYears*12));
//             let diffInDays = Number((currDt-expDt)/(1000 * 60 * 60 * 24));

//             if (diffInDays > -2 && diffInDays <= 0) {
//                 var options2 = { method: 'POST',
//                 url: mailSendingApi,
//                 headers: 
//                 { 'postman-token': 'ada6d640-aeee-2368-ef03-510f8ba1a51d',
//                 'cache-control': 'no-cache',
//                 'content-type': 'application/json' },
//                 body: 
//                 { email: [ products[i].users.email ],
//                 subject: 'Extended Warranty Lapsed',
//                 text: 'Dear '+products[i].users.name+', We noticed you have not been using your account for a while and we miss you!',
//                 html: 'Dear '+products[i].users.name+',<p>Your Extended Warranty for '+products[i].name+' has lapsed on '+expDt+'. Kindly Get in touch with your service provider to continue enjoying the service.</p><p>Feel free to contact our team at support@wevouch.in or reach out to our virtual assistant WeVo on the wevouch app for any further assistance.</p><p>Team wevouch</p>' },
//                 json: true };

//                 request(options2, function (error, response, body) {
//                 if (error) throw new Error(error);

//                 console.log(body);
//                 });
//             }
//         }
//     }

//     //// we miss you section ////
//     // let users = await Users.find({}).sort({ _id: -1 })

//     // for (let i = 0; i < users.length; i++) {

//     //     //trigger push
//     //     if (users[i]?.lastLogin && users[i]?.fcmToken) {
//     //         currDt = new Date();
//     //         expDt = new Date(users[i].lastLogin);
//     //         let diffInDays = Number((currDt-expDt)/(1000 * 60 * 60 * 24));
//     //         console.log({diffInDays});

//     //         if (diffInDays >= "2") {
//     //             const result = await sendPushNotification({
//     //                 "user": users[i]._id,
//     //                 "token": users[i].fcmToken,
//     //                 "notification": {
//     //                 "title": "WE MISS YOU!",
//     //                 "body": "We have not heard from you in a while. Don't let warranty woes interrupt your busy schedule. Just wevouch!"
//     //                 }
//     //             })
//     //         }
//     //     }

//     //     //trigger mail
//     //     if (users[i]?.email) {
//     //         currDt = new Date();
//     //         expDt = new Date(users[i].lastLogin);
//     //         let diffInDays = Number((currDt-expDt)/(1000 * 60 * 60 * 24));
//     //         console.log({diffInDays});

//     //         if (diffInDays >= "2") {
//     //             var options2 = { method: 'POST',
//     //             url: mailSendingApi,
//     //             headers: 
//     //             { 'postman-token': 'ada6d640-aeee-2368-ef03-510f8ba1a51d',
//     //             'cache-control': 'no-cache',
//     //             'content-type': 'application/json' },
//     //             body: 
//     //             { email: [ users[i].email ],
//     //             subject: 'We miss you!',
//     //             text: 'Dear '+users[i].name+', We noticed you have not been using your account for a while and we miss you!',
//     //             html: 'Dear '+users[i].name+',<p>We noticed you have not been using your account for a while and we miss you!</p><p>We know you have been busy and we do not want warranty woes to take up more of your time.</p><p>So let us take care of your assets and you can sit back & relax!</p><p>In case you have any other issue we are here to solve all your issues. Just drop in a mail on support@wevouch.in and we will get back to you within 24 hours.</p><p>Team wevouch</p>' },
//     //             json: true };

//     //             request(options2, function (error, response, body) {
//     //             if (error) throw new Error(error);

//     //             console.log(body);
//     //             });
//     //         }
//     //     }
//     // }
//     // console.log("from send push");
// }, null, true, 'Asia/Kolkata');
// job.start();

module.exports = sendPushNotification;