const express = require("express");
const Version = require("../models/version");
const VersionRoute = express.Router();


VersionRoute.post("/create", async (req, res) => {
	try {
        const VersionData = new Version(req.body);
        const result = await VersionData.save();
        message = {
            error: false,
            message: "Version Added Successfully!",
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

VersionRoute.get("/detail/:VersionId", async (req, res) => {
	try {
		const VersionData = await Version.findOne({ _id: req.params.VersionId });
		if (VersionData.length != 0) {
			message = {
				error: false,
				message: "Version Data Found!",
				data: VersionData,
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
			message: "Version not found!",
			data: err,
		};
		res.status(200).send(message);
	}
});

VersionRoute.patch("/update/:VersionId", async (req, res) => {
	try {
 
		const result = await Version.updateOne({ _id: req.params.VersionId }, req.body);
		message = {
			error: false,
			message: "Version Updated Successfully!"
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

VersionRoute.delete("/delete/:VersionId", async (req, res) => {
	try {
		const result = await Version.deleteOne({ _id: req.params.VersionId });
		if (result.deletedCount == 1) {
			message = {
				error: false,
				message: "Version deleted successfully!",
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

VersionRoute.get("/list", async (req, res) => {
	try {
		const VersionData = await Version.find({});
		if (VersionData.length != 0) {
			message = {
				error: false,
				message: "Version Data Found!",
				data: VersionData,
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
			message: "Version not found!",
			data: err,
		};
		res.status(200).send(message);
	}
});

module.exports = VersionRoute;