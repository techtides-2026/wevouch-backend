const express = require("express");
const InfluencerNotification = require("../models/influencer-notification");
const InfluencerNotificationRoute = express.Router();


InfluencerNotificationRoute.post("/create", async (req, res) => {
	try {
        const InfluencerNotificationData = new InfluencerNotification(req.body);
        const result = await InfluencerNotificationData.save();
        message = {
            error: false,
            message: "InfluencerNotification Added Successfully!",
            data: result,
        };
        res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(200).send(message);
	}
});

InfluencerNotificationRoute.get("/detail/:InfluencerNotificationId", async (req, res) => {
	try {
		const InfluencerNotificationData = await InfluencerNotification.findOne({ _id: req.params.InfluencerNotificationId });
		if (InfluencerNotificationData.length != 0) {
			message = {
				error: false,
				message: "InfluencerNotification Data Found!",
				data: InfluencerNotificationData,
			};
		} else {
			message = {
				error: true,
				message: "No Data Found!",
			};
		}
		res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "InfluencerNotification not found!",
			data: err,
		};
		res.status(200).send(message);
	}
});

InfluencerNotificationRoute.patch("/update/:InfluencerNotificationId", async (req, res) => {
	try {
 
		const result = await InfluencerNotification.updateOne({ _id: req.params.InfluencerNotificationId }, req.body);
		message = {
			error: false,
			message: "InfluencerNotification Updated Successfully!"
		};
		res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(200).send(message);
	}
});

InfluencerNotificationRoute.delete("/delete/:InfluencerNotificationId", async (req, res) => {
	try {
		const result = await InfluencerNotification.deleteOne({ _id: req.params.InfluencerNotificationId });
		if (result.deletedCount == 1) {
			message = {
				error: false,
				message: "InfluencerNotification deleted successfully!",
			};
			res.status(200).send(message);
		} else {
			message = {
				error: true,
				message: "Operation failed!",
			};
			res.status(200).send(message);
		}
	} catch (err) {
		message = {
			error: true,
			message: "Operation Failed!",
			data: err,
		};
		res.status(200).send(message);
	}
});

InfluencerNotificationRoute.get("/list", async (req, res) => {
	try {
		const InfluencerNotificationData = await InfluencerNotification.find({});
		if (InfluencerNotificationData.length != 0) {
			message = {
				error: false,
				message: "InfluencerNotification Data Found!",
				data: InfluencerNotificationData,
			};
		} else {
			message = {
				error: true,
				message: "No Data Found!",
			};
		}
		res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "InfluencerNotification not found!",
			data: err,
		};
		res.status(200).send(message);
	}
});

InfluencerNotificationRoute.get("/list-by-user/:userId", async (req, res) => {
	try {
		const InfluencerNotificationData = await InfluencerNotification.find({influencer: req.params.userId}).sort({_id: -1});
		if (InfluencerNotificationData.length != 0) {
			message = {
				error: false,
				message: "InfluencerNotification Data Found!",
				data: InfluencerNotificationData,
			};
		} else {
			message = {
				error: true,
				message: "No Data Found!",
			};
		}
		res.status(200).send(message);
	} catch (err) {
		message = {
			error: true,
			message: "InfluencerNotification not found!",
			data: err,
		};
		res.status(200).send(message);
	}
});


module.exports = InfluencerNotificationRoute;