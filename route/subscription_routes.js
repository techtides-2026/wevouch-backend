const express = require("express");
const Subscriptions = require("../models/subscription");
const subscriptionRoute = express.Router();

subscriptionRoute.get("/list", async (req, res) => {
  const subscriptions = await Subscriptions.find();
  res.send(subscriptions);
});

subscriptionRoute.post("/add", async (req, res) => {
  try {
    if (req.body.name && req.body.amount !==undefined && req.body.expiryDate) {
      const subscription = await Subscriptions.findOne({ name: req.body.name });
      if (subscription) {
        return res.status(403).send({
          message: "A subscription with a similar name exists.",
        });
      }
      let newSubscription = new Subscriptions();

      // Initialize new Subscription object with request data
      (newSubscription.name = req.body.name),
      (newSubscription.imageUrl = req.body.imageUrl),
      (newSubscription.amount = req.body.amount),
      (newSubscription.expiryDate = req.body.expiryDate),
      (newSubscription.ticketCount = req.body.ticketCount),
        (newSubscription.description = req.body.description);

      // Save new Subscription object to database
      newSubscription.save((err) => {
        if (err) {
          console.log(err);
          return res.status(400).send({
            message: "Failed to add subscription.",
          });
        } else {
          return res.status(200).send({
            message: "Subscription added successfully.",
          });
        }
      });
    } else {
      res.status(403).send({
        message: "Subscription Name, Amont and Expiry Date are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

subscriptionRoute.get("/get/:id", async (req, res) => {
  try {
    const subscription = await Subscriptions.findOne({ _id: req.params.id });
    if (subscription) {
      res.status(200).send(subscription);
    } else {
      res.status(404).send({
        error: "Subscription doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Subscription doesn't exist!" });
  }
});

subscriptionRoute.patch("/update/:id", async (req, res) => {
  try {
    const subscription = await Subscriptions.findOne({ _id: req.params.id });
    if (subscription) {
      if (req.body.name) {
        subscription.name = req.body.name;
      }
      if (req.body.description) {
        subscription.description = req.body.description;
      }
      if (req.body.amount) {
        subscription.amount = req.body.amount;
      }
      if (req.body.expiryDate) {
        subscription.expiryDate = req.body.expiryDate;
      }
      if (req.body.ticketCount) {
        subscription.ticketCount = req.body.ticketCount;
      }
      const subscriptionExists = await Subscriptions.findOne({ name: req.body.name });
      if(subscriptionExists && subscriptionExists._id.toString() !== req.params.id)
      {
        return res.status(403).send({
            message: "A subscription with a similar name exists.",
          });
      }

      await subscription.save();
      res.status(200).send(subscription);
    } else {
      res.status(404).send({
        error: "Subscription doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Subscription doesn't exist!" });
  }
});

subscriptionRoute.delete("/delete/:id", async (req, res) => {
  try {
    const subscription = await Subscriptions.findOne({ _id: req.params.id });
    if (subscription) {
      await Subscriptions.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Subscription doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Subscription doesn't exist!" });
  }
});

module.exports = subscriptionRoute;
