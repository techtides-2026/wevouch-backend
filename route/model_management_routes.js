const express = require("express");
const mongoose = require("mongoose");

const ModelManagement = require("../models/model-management");
const { model } = require("../models/model-management");
const modelManagementRoute = express.Router();

function randomString(length, chars) {
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
modelManagementRoute.get("/list", async (req, res) => {
  const modelManagements = await ModelManagement.find()
    .sort({ createdAt: -1 })
    .populate("category brands subCategory");
  res.send(modelManagements);
});

modelManagementRoute.post("/add", async (req, res) => {
  try {
    if (
      req.body.modelName &&
      req.body.modelId && 
      req.body.categoryId &&
      req.body.subCategoryId &&
      req.body.brandId
    ) {
      const modelManagement = await ModelManagement.findOne({
        modelName: req.body.modelName,
      });
      if (modelManagement) {
        return res.status(403).send({
          message: "A Model Management with a similar name exists.",
        });
      }
      let newServiceCenter = new ModelManagement();

      // Initialize new Model Management object with request data
      (newServiceCenter.modelName = req.body.modelName),
        (newServiceCenter.modelId = req.body.modelId),
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
      // Save new Model Management object to database
      newServiceCenter.save((err) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add model management.",
          });
        } else {
          return res.status(200).send({
            message: "Model Management added successfully.",
          });
        }
      });
    } else {
      res.status(403).send({
        message:
          "Model Name, Model Id, Brand Id, Category Id and Sub Category Id are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

modelManagementRoute.get("/get/:id", async (req, res) => {
  try {
    const serviceCenter = await ModelManagement.findOne({
      _id: req.params.id,
    }).populate("category brands subCategory");
    if (serviceCenter) {
      res.status(200).send(serviceCenter);
    } else {
      res.status(404).send({
        error: "Model Management doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Model Management doesn't exist!" });
  }
});

modelManagementRoute.patch("/update/:id", async (req, res) => {
  try {
    const serviceCenter = await ModelManagement.findOne({ _id: req.params.id });
    if (serviceCenter) {
      if (req.body.modelId) {
        serviceCenter.centerName = req.body.modelId;
      }
      if (req.body.modelName) {
        serviceCenter.city = req.body.modelName;
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
      const serviceCenterExists = await ModelManagement.findOne({
        centerName: req.body.centerName,
      });
      if (serviceCenterExists && serviceCenterExists._id.toString() !== req.params.id) {
        return res.status(403).send({
          message: "A Model Management with a similar name exists.",
        });
      }

      await serviceCenter.save();
      res.status(200).send(serviceCenter);
    } else {
      res.status(404).send({
        error: "Model Management doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Model Management doesn't exist!" });
  }
});

modelManagementRoute.delete("/delete/:id", async (req, res) => {
  try {
    const category = await ModelManagement.findOne({ _id: req.params.id });
    if (category) {
      await ModelManagement.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Model Management doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Model Management doesn't exist!" });
  }
});
modelManagementRoute.patch("/toggle-model-mgmt-status/:id", async (req, res) => {
  try {
    if (req.body.status) {
      let category = await ModelManagement.findOne({ _id: req.params.id });
      if (category) {
        const newCategory = new ModelManagement();
        newCategory._id = category._id;
        newCategory.status = req.body.status;
        const filter = { _id: req.params.id };
        const updateCategory = await ModelManagement.findOneAndUpdate(
          filter,
          newCategory,
          {
            new: true,
          }
        );

        res.status(200).send(updateCategory);
      } else {
        res.status(404).send({
          error: "Model Management doesn't exist!",
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

module.exports = modelManagementRoute;
