const express = require("express");
const Settings = require("../models/settings");
const settingsRoute = express.Router();

settingsRoute.get("/list", async (req, res) => {
  const settings = await Settings.find();
  res.send(settings);
});

settingsRoute.post("/create", async (req, res) => {
	try {
    const Settings = new Settings(req.body);
    const result = await Settings.save();
    message = {
      error: false,
      message: "Settings Added Successfully!",
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

settingsRoute.patch("/update/:id", async (req, res) => {
  try {
    const settings = await Settings.findOne({ _id: req.params.id });
    if (settings) {
      if (req.body.companyName) {
        settings.companyName = req.body.companyName;
      }
      if (req.body.companyAddress) {
        settings.companyAddress = req.body.companyAddress;
      }
      if (req.body.emailId) {
        settings.emailId = req.body.emailId;
      }
      if (req.body.mobileNo) {
        settings.mobileNo = req.body.mobileNo;
      }
      if (req.body.whatsappNo) {
        settings.whatsappNo = req.body.whatsappNo;
      }

      await settings.save();
      res.status(200).send(settings);
    } else {
      res.status(404).send({
        error: "Settings doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Settings doesn't exist!" });
  }
});


module.exports = settingsRoute;
