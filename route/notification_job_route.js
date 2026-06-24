const express = require("express");
const NotificationJob = require("../models/notification_job");
const NotificationJobDetail = require("../models/notification_job_detail");
const NotificationJobRoute = express.Router();
const fetch = require('node-fetch');

NotificationJobRoute.get("/list", async (req, res) => {
  try {
    const notificationJobs = await NotificationJob.find({}).sort({_id: -1})

    return res.status(200).send({
        error: false,
        message: "Notification job list",
        data: notificationJobs
    })
  } catch (error) {
    return res.status(200).send({
        error: true,
        message: error.toString()
    })
  }
});

NotificationJobRoute.get("/new-list", async (req, res, next) => {
    try {
        const pageNumber = +req.query.page;
        const nPerPage = +req.query.count;
        let query = [{_id: {$ne: null}}];
        if (req.query.title) {
            query.push({title: {$regex: req.query.title, $options: 'i'}})
        }
        if(req.query.date) {
            let lessThanDate = new Date(req.query.date)
            lessThanDate.setDate(lessThanDate.getDate()+1)
    
            console.log(new Date(req.query.date), lessThanDate);
            query.push(
                {"createdAt": {
                $gte: new Date(req.query.date), 
                $lt: lessThanDate
                }}
            )
        }
        const notificationJobs = await NotificationJob.find({$and: query}).sort({_id: -1})
            .sort({_id: -1})
            .skip( pageNumber > 0 ? ( ( pageNumber - 1 ) * nPerPage ) : 0 )
            .limit( nPerPage )

        const totalJobs = await NotificationJob.count({$and: query})

        return res.status(200).send({
            error: false,
            message: "Notification job list",
            data: notificationJobs,
            totalJobs,
            dataPerpage: nPerPage
        })
    } catch (error) {
        next(error);
    }
})

NotificationJobRoute.post("/create-new", async (req, res, next) => {
    try {
        let notificationJobDatas = []
        let usersArr = req.body.users;

        let userCount = 0;
        let successCount = 0;
        let failureCount = 0;

        for(let i in usersArr) {
            let isSuccess = false;
            const body = {
                "app_id": process.env.ONESIGNAL_APP_ID,
                "contents": {"en": req.body.message},
                "headings": {"en": req.body.ttitle},
                "include_player_ids": [usersArr[i].onesignalId]
            }
        
            const response = await fetch(process.env.ONESIGNAL_SEND_PUSH_API, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: {'Content-Type': 'application/json'}
            });
            const pushResp = await response.json();
            userCount += 1
            console.log("pushResp", pushResp);
            if (pushResp?.recipients == 1) {
                successCount += 1
                isSuccess = true
            } 
            if(pushResp?.recipients == 0 || pushResp.errors) {
                failureCount += 1
                isSuccess = false
            }
            notificationJobDatas.push({
                user: usersArr[i].user,
                token: usersArr[i].onesignalId,
                isSuccess,
                message: (pushResp.errors || pushResp?.recipients == 0) ? (pushResp.errors ? JSON.stringify(pushResp.errors) : "Message sending failed") : "Message successfully sent" 
            })
        }

        const NotificationJobData = new NotificationJob({
            title: req.body.title,
            message: req.body.message,
            successCount: successCount,
            failureCount: failureCount,
            userCount: userCount
        });

        const NotificationJobDataResult = await NotificationJobData.save();
        notificationJobDatas.map(e => e.notificationJob = NotificationJobDataResult?._id)

        const jobDetails = await NotificationJobDetail.insertMany(notificationJobDatas)

        res.status(201).send({ 
            error: false,
            message: 'Notification job created',
            data: NotificationJobDataResult,
            jobDetails
        })
        
    } catch (err) {
        next(err);
    }
});

NotificationJobRoute.post("/create", async (req, res) => {
    try {
        let usersArr = req.body.users;

        const NotificationJobData = new NotificationJob({title: req.body.title, message: req.body.message, userCount: usersArr.length, successCount: usersArr.filter(e => e.isSuccess == true).length, failureCount: usersArr.filter(e => e.isSuccess == false).length});
        const NotificationJobResult = await NotificationJobData.save();
        
        if (NotificationJobResult) {
            usersArr.map(e => {
                e.notificationJob = NotificationJobResult._id;
                return e;
            })
            
            const NotificationJobDetailResult = await NotificationJobDetail.insertMany(usersArr, {orderd: true});
            
            message = {
                error: false,
                message: "Notifiction job Added Successfully!",
                data: NotificationJobDetailResult,
            };
            return res.status(200).send(message);
        } else {
            message = {
                error: true,
                message: "Notification job not created successfully"
            };
            return res.status(200).send(message);
        }
        
	} catch (err) {
		message = {
			error: true,
			message: err.toString()
		};
		res.status(200).send(message);
	}
});


NotificationJobRoute.get("/detail/:notificationJobId", async (req, res) => {
	try {
        const NotificationJobDetailData = await NotificationJobDetail.find({notificationJob: req.params.notificationJobId});
        message = {
            error: false,
            message: "Notifiction job data found!",
            data: NotificationJobDetailData,
        };
        res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: err.toString()
		};
		res.status(200).send(message);
	}
});


module.exports = NotificationJobRoute