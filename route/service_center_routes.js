const express = require("express");
const mongoose = require("mongoose");

const ServiceCenter = require("../models/service-center");
const serviceCenterRoute = express.Router();

function randomString(length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
serviceCenterRoute.get("/list", async (req, res) => {
  const serviceCenters = await ServiceCenter.find()
    .sort({ createdAt: -1 })
    .populate("category brands subCategory");
  res.send(serviceCenters);
});

serviceCenterRoute.post("/add", async (req, res) => {
  try {
    if (
      req.body.centerName &&
      req.body.categoryId &&
      req.body.subCategoryId &&
      req.body.brandId
    ) {
      const serviceCenter = await ServiceCenter.findOne({
        centerName: req.body.centerName,
      });
      if (serviceCenter) {
        return res.status(403).send({
          message: "A Service Center with a similar name exists.",
        });
      }
      let newServiceCenter = new ServiceCenter();

      // Initialize new Service Center object with request data
      (newServiceCenter.centerName = req.body.centerName),
        (newServiceCenter.city = req.body.city),
        (newServiceCenter.address = req.body.address),
        (newServiceCenter.pin = req.body.pin),
        (newServiceCenter.mobile = req.body.mobile),
        (newServiceCenter.email = req.body.email),
        (newServiceCenter.contactPerson = req.body.contactPerson),
        (newServiceCenter.category = mongoose.Types.ObjectId(
          req.body.categoryId
        )),
        (newServiceCenter.brands = mongoose.Types.ObjectId(req.body.brandId)),
        (newServiceCenter.uniqueId =
          "srvc_" +
          randomString(
            6,
            "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
          )),
        (newServiceCenter.subCategory = mongoose.Types.ObjectId(
          req.body.subCategoryId
        ));

      if (req.body.status) {
        newServiceCenter.status = req.body.status;
      }
      const sDate = new Date();
      newServiceCenter.createdAt = new Date(
        sDate.getFullYear(),
        sDate.getMonth(),
        sDate.getDate(),
        1,
        0,
        0
      );
      // Save new Service Center object to database
      newServiceCenter.save((err) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add service center.",
          });
        } else {
          return res.status(200).send({
            message: "Service Center added successfully.",
          });
        }
      });
    } else {
      res.status(403).send({
        message:
          "Center Name, Brand Id, Category Id and Sub Category Id are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

serviceCenterRoute.get("/get/:id", async (req, res) => {
  try {
    const serviceCenter = await ServiceCenter.findOne({
      _id: req.params.id,
    }).populate("category brands subCategory");
    if (serviceCenter) {
      res.status(200).send(serviceCenter);
    } else {
      res.status(404).send({
        error: "Service Center doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Service Center doesn't exist!" });
  }
});

serviceCenterRoute.patch("/update/:id", async (req, res) => {
  try {
    const serviceCenter = await ServiceCenter.findOne({ _id: req.params.id });
    if (serviceCenter) {
      if (req.body.centerName) {
        serviceCenter.centerName = req.body.centerName;
      }
      if (req.body.city) {
        serviceCenter.city = req.body.serviceCenter;
      }
      if (req.body.address) {
        serviceCenter.address = req.body.address;
      }
      if (req.body.pin) {
        serviceCenter.pin = req.body.pin;
      }
      if (req.body.mobile) {
        serviceCenter.mobile = req.body.mobile;
      }
      if (req.body.email) {
        serviceCenter.email = req.body.email;
      }
      if (req.body.contactPerson) {
        serviceCenter.contactPerson = req.body.contactPerson;
      }
      if (req.body.categoryId) {
        serviceCenter.category = mongoose.Types.ObjectId(req.body.categoryId);
      }
      if (req.body.brandId) {
        serviceCenter.brands = mongoose.Types.ObjectId(req.body.brandId);
      }
      if (req.body.subCategoryId) {
        serviceCenter.subCategory = mongoose.Types.ObjectId(req.body.subCategoryId);
      }
      const serviceCenterExists = await ServiceCenter.findOne({
        centerName: req.body.centerName,
      });
      if (serviceCenterExists && serviceCenterExists._id.toString() !== req.params.id) {
        return res.status(403).send({
          message: "A Service Center with a similar name exists.",
        });
      }

      await serviceCenter.save();
      res.status(200).send(serviceCenter);
    } else {
      res.status(404).send({
        error: "Service Center doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Service Center doesn't exist!" });
  }
});

serviceCenterRoute.delete("/delete/:id", async (req, res) => {
  try {
    const category = await ServiceCenter.findOne({ _id: req.params.id });
    if (category) {
      await ServiceCenter.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Service Center doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Service Center doesn't exist!" });
  }
});
serviceCenterRoute.patch("/toggle-srvc-center-status/:id", async (req, res) => {
  try {
    if (req.body.status) {
      let category = await ServiceCenter.findOne({ _id: req.params.id });
      if (category) {
        const newCategory = new ServiceCenter();
        newCategory._id = category._id;
        newCategory.status = req.body.status;
        const filter = { _id: req.params.id };
        const updateCategory = await ServiceCenter.findOneAndUpdate(
          filter,
          newCategory,
          {
            new: true,
          }
        );

        res.status(200).send(updateCategory);
      } else {
        res.status(404).send({
          error: "Service Center doesn't exist!",
        });
      }
    } else {
      res.status(403).send({ message: "Status is required" });
    }
  } catch (error) {
    res.status(500);
    res.send({ error: error });
  }
});

module.exports = serviceCenterRoute;
