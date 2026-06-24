const express = require("express");
const Banners = require("../models/banners");
const bannerRoute = express.Router();

bannerRoute.get("/list", async (req, res) => {
  const banners = await Banners.find().sort({"createdAt": -1});
  res.send(banners);
});

bannerRoute.post("/add", async (req, res) => {
  try {
    if (req.body.name) {
      const banner = await Banners.findOne({ name: req.body.name });
      if (banner) {
        return res.status(403).send({
          message: "A banner with a similar name exists.",
        });
      }
      let newBanner = new Banners();

      // Initialize new Banner object with request data
      (newBanner.name = req.body.name),
        (newBanner.imageUrl = req.body.imageUrl);
        const sDate = new Date();
        (newBanner.createdAt = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          1,
          0,
          0
        ));
      // Save new Banner object to database
      newBanner.save((err) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add banner.",
          });
        } else {
          return res.status(200).send({
            message: "Banner added successfully.",
          });
        }
      });
    } else {
      res.status(403).send({
        message: "Banner Name is required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

bannerRoute.get("/get/:id", async (req, res) => {
  try {
    const banner = await Banners.findOne({ _id: req.params.id });
    if (banner) {
      res.status(200).send(banner);
    } else {
      res.status(404).send({
        error: "Banner doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Banner doesn't exist!" });
  }
});

bannerRoute.patch("/update/:id", async (req, res) => {
  try {
    const banner = await Banners.findOne({ _id: req.params.id });
    if (banner) {
      if (req.body.name) {
        banner.name = req.body.name;
      }
      if (req.body.imageUrl) {
        banner.imageUrl = req.body.imageUrl;
      }
      const bannerExists = await Banners.findOne({ name: req.body.name });
      if(bannerExists && bannerExists._id.toString() !== req.params.id)
      {
        return res.status(403).send({
            message: "A banner with a similar name exists.",
          });
      }

      await banner.save();
      res.status(200).send(banner);
    } else {
      res.status(404).send({
        error: "Banner doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Banner doesn't exist!" });
  }
});

bannerRoute.delete("/delete/:id", async (req, res) => {
  try {
    const banner = await Banners.findOne({ _id: req.params.id });
    if (banner) {
      await Banners.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Banner doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Banner doesn't exist!" });
  }
});

module.exports = bannerRoute;
