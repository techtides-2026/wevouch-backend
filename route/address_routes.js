const express = require("express");
const mongoose = require('mongoose');
const request = require("request");

const Address = require("../models/address");
const Users = require("../models/users");
const addressRoute = express.Router();

addressRoute.get("/list", async (req, res) => {
  const subCategories = await Address.find().sort({"createdAt": -1}).populate("user");
  res.send(subCategories);
});

addressRoute.get("/get-by-user/:id", async (req, res) => {
    const subCategories = await Address.find({user: req.params.id}).sort({"createdAt": -1}).populate("user");
    res.send(subCategories);
});

//dt. 26-03-2022
addressRoute.get("/get-by-user-id/:id", async (req, res) => {
    try {
      const addresses = await Address.find({user: req.params.id}).sort({"createdAt": -1}).populate("user");
      res.send({
        error: false,
        message: "Address list by user",
        data: addresses
      });
    } catch (error) {
      res.send({
        error: true,
        data: error
      });
    }
});

addressRoute.post("/add", async (req, res) => {
  try {
    if (req.body.userId) {
      const userData = await Users.findOneAndUpdate({_id: req.body.userId}, {isAddressAdded: true}, {new: true});
      let newAddress = new Address();

      // Initialize new Address object with request data
      (newAddress.addressLine1 = req.body.addressLine1),
      (newAddress.addressLine2 = req.body.addressLine2),
      (newAddress.user = mongoose.Types.ObjectId(req.body.userId));
        (newAddress.location = req.body.location);
        newAddress.latitude = req.body.latitude;
        newAddress.longitude = req.body.longitude;
        newAddress.state = req.body.state;
        newAddress.city = req.body.city;
        newAddress.country = req.body.country;
        newAddress.pin = req.body.pin;
        const sDate = new Date();
        (newAddress.createdAt = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          sDate.getHours(),
          sDate.getMinutes(),
          sDate.getSeconds(),
          sDate.getMilliseconds()
        ));
      // Save new Sub Category object to database
      newAddress.save((err) => {
          console.log("err", err);
        if (err) {
          return res.status(400).send({
            message: "Failed to add address.",
          });
        } else {
          /**
           * Here we are storing the data in new database as well
           */
          let userAddress = JSON.parse(JSON.stringify(newAddress));
          userAddress.lng = newAddress.longitude;
          userAddress.lat = newAddress.latitude;

          return res.status(200).send({
            userData,
            message: "Address added successfully.",
          });
        }
      });
    } else {
      res.status(403).send({
        message: "Address Line 1 is required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

addressRoute.get("/get/:id", async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id }).populate("user");
    if (address) {
      res.status(200).send(address);
    } else {
      res.status(404).send({
        error: "Address doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Address doesn't exist!" });
  }
});


addressRoute.patch("/update/:id", async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id });
    if (address) {
      if (req.body.addressLine1) {
        address.addressLine1 = req.body.addressLine1;
      }
      if (req.body.addressLine2) {
        address.addressLine2 = req.body.addressLine2;
      }
      if (req.body.location) {
        address.location = req.body.location;
      }
      if (req.body.latitude) {
        address.latitude = req.body.latitude;
      }
      if (req.body.longitude) {
        address.longitude = req.body.longitude;
      }
      if (req.body.state) {
        address.state = req.body.state;
      }
      if (req.body.city) {
        address.city = req.body.city;
      }
      if (req.body.country) {
        address.country = req.body.country;
      }
      if (req.body.pin) {
        address.pin = req.body.pin;
      }

      /**
       * Here we are storing the data in new database as well
       */
      let userAddress = JSON.parse(JSON.stringify(address));
      userAddress.lng = address.longitude;
      userAddress.lat = address.latitude;

      const addressUpdate = await address.save();
      const userData = await Users.findOneAndUpdate({_id: req.body.userId}, {isAddressAdded: true}, {new: true});
      res.status(200).send({address, userData});

    } else {
      res.status(404).send({
        error: "Address doesn't exist!",
      });
    }
  } catch(err) {
    res.status(404);
    res.send({ message: "Operation failed", error: String(err) });
  }
});

addressRoute.delete("/delete/:id", async (req, res) => {
  try {
    const category = await Address.findOne({ _id: req.params.id });
    if (category) {
      await Address.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Address doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Address doesn't exist!" });
  }
});


module.exports = addressRoute;
