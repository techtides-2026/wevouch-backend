const express = require("express");
const UserTransactionLog = require("../models/user-transaction-log");
const mongoose = require('mongoose');

const userTransactionLogRoute = express.Router();

userTransactionLogRoute.get("/list", async (req, res) => {
  const userTransactions = await UserTransactionLog.find();
  res.send(userTransactions);
});

userTransactionLogRoute.post("/add", async (req, res) => {
  try {
    if (req.body.userId && req.body.transactionId && req.body.transactionAmount) {
      let newTransaction = new UserTransactionLog();
      const sDate = new Date();
      // Initialize new User Transaction Log object with request data
      (newTransaction.user = mongoose.Types.ObjectId(req.body.userId)),
      (newTransaction.subscription = mongoose.Types.ObjectId(req.body.subscriptionId)),
      (newTransaction.transactionId = req.body.transactionId),
      (newTransaction.transactionAmount = req.body.transactionAmount),
      (newTransaction.createdAt = new Date(
        sDate.getFullYear(),
        sDate.getMonth(),
        sDate.getDate(),
        sDate.getHours(),
        sDate.getMinutes(),
        sDate.getSeconds(),
        sDate.getMilliseconds()
      ));

      // Save new User Transaction object to database
      newTransaction.save((err) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add transaction.",
          });
        } else {
          return res.status(200).send({
            message: "Transaction added successfully.",
          });
        }
      });
    } else {
      res.status(403).send({
        message: "User Id, Subscription Id, Transaction Id and Amount are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

userTransactionLogRoute.get("/get/:id", async (req, res) => {
  try {
    const subscription = await UserTransactionLog.findOne({ _id: req.params.id });
    if (subscription) {
      res.status(200).send(subscription);
    } else {
      res.status(404).send({
        error: "Transaction doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Transaction doesn't exist!" });
  }
});



userTransactionLogRoute.delete("/delete/:id", async (req, res) => {
  try {
    const subscription = await UserTransactionLog.findOne({ _id: req.params.id });
    if (subscription) {
      await UserTransactionLog.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Transaction doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Transaction doesn't exist!" });
  }
});
userTransactionLogRoute.get("/get-all-transaction", async (req, res) => {
    try {
      const transactions = await UserTransactionLog.find().populate(
        "user subscription"
      );
      res.status(200).send(transactions);
    } catch {
      res.status(404);
      res.send({ error: "Transaction doesn't exist!" });
    }
  });

  userTransactionLogRoute.get("/get-user-transaction/:userId", async (req, res) => {
    try {
      const transactions = await UserTransactionLog.find({user: req.params.userId});
      res.status(200).send({
        error: false,
        message: "User Transactions",
        data: transactions
      });
    } catch(err) {
      res.status(200);
      res.send({ error: true, message: "Transactions doesn't exist!" });
    }
  });

module.exports = userTransactionLogRoute;
