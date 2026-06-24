const express = require("express");
const mongoose = require("mongoose");
const PushNotifications = require("../models/fcm_reg_token");
const Products = require("../models/products");
const Users = require("../models/users");
const mailSendingApi = 'http://3.136.213.9:5000/api/mail/send';
var request = require("request");
var axios = require('axios');
const sendNotification = require("./sendNotification");
const Ticket = require("../models/tickets");
var CronJob = require('cron').CronJob;
const app_id = "37ee6ce1-016c-4993-b2b9-3d83669b0cb3";

const sendOnesignalPush = async (req, res) => {
    try {
        console.log('try block');
        if (req.message && req.title && req.player_ids) {
            var data = JSON.stringify({
                "app_id": app_id,
                "contents": {
                  "en": req.message
                },
                "headings": {
                  "en": req.title
                },
                "include_player_ids": req.player_ids
            });
            
            var config = {
                method: 'post',
                url: 'https://onesignal.com/api/v1/notifications',
                headers: { 
                    'Content-Type': 'application/json'
                },
                data : data
            };
            
            axios(config)
            .then(function (response) {
                console.log(JSON.stringify(response.data));
                return JSON.stringify(response.data)
            })
            .catch(function (error) {
                console.log(error.response.data);
                return error.response.data
            });
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

const job = new CronJob('00 00 10 * * *', async () => {

    //// warranty section ////
    let products = await Products.find({}).sort({ _id: -1 }).populate([
        {
            path: "users",
            select: "name email mobile fcmToken uuid player_id"
        }
    ]);
    products = products.filter(e => e.purchaseDate && e.warrantyPeriod != null && e.users )
    // console.log(products, "products");
    for (let i = 0; i < products.length; i++) {
        //warranty section
        if (products[i].purchaseDate || products[i].purchaseDate != null) {
            currDt = new Date();
            expDt = new Date(products[i].purchaseDate);
            expDt.setMonth(expDt.getMonth() + products[i].warrantyPeriod);
            let diffInDays = Number((currDt-expDt)/(1000 * 60 * 60 * 24));
            console.log("warranty", diffInDays, products[i].users?.name);


            if (diffInDays > -2 && diffInDays <= 0) {
                console.log("Warranty lapsed");
                const result = await sendOnesignalPush({
                    "title": "Warranty Expired",
                    "message": `OOPS, YOUR WARRANTY JUST EXPIRED! 😟 Your warranty for ${products[i]?.brands} ${products[i]?.category} has expired on ${expDt}. Hope it works just fine. In case something goes wrong, you know we are there for you🙋🏻‍♂️`,
                    "player_ids": [products[i].users?.player_id]
                })

                //in app notification
                const userNotification = await sendNotification({userId: products[i].users?._id, title: 'Warranty Expired', desc: `Dear ${products[i].users?.name || 'user'}, your warranty for ${products[i]?.brands} ${products[i]?.category} has expired on ${expDt}`});
            } 
            if (diffInDays >= -4 && diffInDays <= -3) {
                console.log("3 Days waaranty");
                const result = await sendOnesignalPush({
                    "title": "Warranty Expiry 3 days",
                    "message": `TIME IS TUNNING OUT! ⏱️ Dear ${products[i].users?.name || 'user'}, your warranty for ${products[i]?.name} will Expire in 3 days on ${expDt}. Act Now and get it repaired!`,
                    "player_ids": [products[i].users?.player_id]
                })

                //in app notification
                const userNotification = await sendNotification({userId: products[i].users?._id, title: 'Warranty Expiry 3 days', desc: `Dear ${products[i].users?.name || 'user'}, your warranty for ${products[i]?.name} will expire in 3 days on ${expDt}. Act now and get it repaired.`});
            } 
            if (diffInDays >= -31 && diffInDays <= -30) {
                console.log("30 Days waaranty");
                const result = await sendOnesignalPush({
                    "title": "Warranty Expiry 30 days",
                    "message": `HURRY! WARRANTY EXPIRES IN 30 DAYS! Your warranty for ${products[i]?.name} will expire on ${expDt}. Its still time to get it repaired.`,
                    "player_ids": [products[i].users?.player_id]

                })

                //in app notification
                const userNotification = await sendNotification({userId: products[i].users?._id, title: 'Warranty Expiry 30 days', desc: `Dear ${products[i].users?.name || 'user'}, your warranty for ${products[i]?.name} will expire in 30 days on ${expDt}. Its still time to get it repaired.`});
            }
        }

        //// extended warranty section ////
        
        //// trigger push
        if (products[i].extendedWarranty?.startDate && products[i].extendedWarranty.noOfYears) {
            currDt = new Date();
            expDt = new Date(products[i].extendedWarranty?.startDate);
            expDt.setMonth(expDt.getMonth() + (products[i].extendedWarranty.noOfYears*12));
            let diffInDays = Number((currDt-expDt)/(1000 * 60 * 60 * 24));
            
            console.log("extd warranty", diffInDays);
            // console.log(products[i].extendedWarranty?.startDate , products[i].extendedWarranty?.noOfYears);


            if (diffInDays > -2 && diffInDays <= 0) {
                console.log("Warranty lapsed");
                const result = await sendOnesignalPush({
                    "title": "Extended Warranty lapsed",
                    "message": "EXTENDED WARRANTY LAPSED! Your extended warranty for "+products[i]?.name+" has lapsed.",
                    "player_ids": [products[i].users?.player_id]
                })
            }
        }

        //// trigger mail
        if (products[i].extendedWarranty?.startDate && products[i].extendedWarranty.noOfYears && products[i].users?.email) {
            currDt = new Date();
            expDt = new Date(products[i].extendedWarranty?.startDate);
            expDt.setMonth(expDt.getMonth() + (products[i].extendedWarranty.noOfYears*12));
            let diffInDays = Number((currDt-expDt)/(1000 * 60 * 60 * 24));

            if (diffInDays > -2 && diffInDays <= 0) {
                var options2 = { 
                    method: 'POST',
                    url: mailSendingApi,
                    headers: 
                    { 
                        'postman-token': 'ada6d640-aeee-2368-ef03-510f8ba1a51d',
                        'cache-control': 'no-cache',
                        'content-type': 'application/json' 
                    },
                    body: { 
                        email: [ products[i].users.email ],
                        subject: 'Extended Warranty Lapsed',
                        text: 'Dear '+products[i].users.name+', We noticed you have not been using your account for a while and we miss you!',
                        html: 'Dear '+products[i].users.name+',<p>Your Extended Warranty for '+products[i].name+' has lapsed on '+expDt+'. Kindly Get in touch with your service provider to continue enjoying the service.</p><p>Feel free to contact our team at support@wevouch.in or reach out to our virtual assistant WeVo on the wevouch app for any further assistance.</p><p>Team wevouch</p>' 
                    },
                    json: true 
                };

                request(options2, function (error, response, body) {
                if (error) throw new Error(error);

                console.log(body);
                });
            }
        }
    }


    //// ticket section ////
    let tickets = await Ticket.find({srn: {$ne: undefined}, srnAddedOn: {$ne: undefined}}).populate([
        {
            path: "users",
            select: "name email mobile fcmToken uuid player_id"
        },
        {
            path: 'products',
            select: 'name brands category'
        }
    ]);
    tickets = tickets.filter(e => e.products && e.users )
    for (let i = 0; i < tickets.length; i++) {
        currDt = new Date();
        expDt = new Date(tickets[i].srnAddedOn);
        let diffInDays = Number((currDt-expDt)/(1000 * 60 * 60 * 24));
        console.log("SRN Added", diffInDays, tickets[i].users?.mobile);
        if (diffInDays >= 7 && diffInDays <= 9) {
            var whatsappOption = {
                'method': 'POST',
                'url': 'https://api.kaleyra.io/v1/HXIN1715939006IN/messages',
                'headers': {
                  'api-key': 'A2f66c3daa74e66ffa590cebe1906b582',
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                  'from': '918240052950',
                  'to': `91${tickets[i]?.user?.mobile}`,
                  'type': 'template',
                  'channel': 'whatsapp',
                  'template_name': 'close_ticket_reminder',
                  'params': `"${tickets[i]?.user?.name}","${tickets[i]?.products?.category}","${tickets[i]?.products?.brands}"`,
                  'lang_code': 'en'
                }
            };
            request(whatsappOption, function (error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
            });
        }
    }
}, null, true, 'Asia/Kolkata');
job.start();

module.exports = sendOnesignalPush;