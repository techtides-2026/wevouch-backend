const express = require("express");
const Brands = require("../models/brands");
const brandRouter = express.Router();

brandRouter.get("/list", async (req, res) => {
  const brands = await Brands.find().sort({"createdAt": -1});
  res.send(brands);
});

brandRouter.post("/add", async (req, res) => {
  try {
    if (req.body.name) {
      const brand = await Brands.findOne({ name: req.body.name });
      if(brand)
      {
        return res.status(403).send({
            message: "A brand with a similar name exists.",
          });
      }
      let newBrand = new Brands();

      // Initialize new Brand object with request data
      (newBrand.name = req.body.name),
        (newBrand.imageUrl = req.body.imageUrl);
        const sDate = new Date();
        (newBrand.createdAt = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          1,
          0,
          0
        ));
        if(req.body.status)
        {
          newBrand.status= req.body.status;
        }
      // Save new Brand object to database
      newBrand.save((err) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add brand.",
          });
        } else {
          return res.status(200).send({
            message: "Brand added successfully.",
          });
        }
      });
    } else {
      res.status(403).send({
        message: "Brand Name is required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});



brandRouter.get("/get/:id", async (req, res) => {
  try {
    const brand = await Brands.findOne({ _id: req.params.id });
    if (brand) {
      res.status(200).send(brand);
    } else {
      res.status(404).send({
        error: "Brand doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Brand doesn't exist!" });
  }
});

brandRouter.patch("/update/:id", async (req, res) => {
  try {
    const brand = await Brands.findOne({ _id: req.params.id });
    if (brand) {
      if (req.body.name) {
        brand.name = req.body.name;
      }
      if (req.body.imageUrl) {
        brand.imageUrl = req.body.imageUrl;
      }
      const brandExists = await Brands.findOne({ name: req.body.name });
      if(brandExists && brandExists._id.toString() !== req.params.id)
      {
        return res.status(403).send({
            message: "A brand with a similar name exists.",
          });
      }
   
      await brand.save();
      res.status(200).send(brand);
    } else {
      res.status(404).send({
        error: "Brand doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Brand doesn't exist!" });
  }
});

brandRouter.delete("/delete/:id", async (req, res) => {
  try {
    const brand = await Brands.findOne({ _id: req.params.id });
    if (brand) {
      await Brands.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Brand doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Brand doesn't exist!" });
  }
});
brandRouter.patch("/toggle-brand-status/:id", async (req, res) => {
  try {
    if(req.body.status)
    {
      let brand = await Brands.findOne({ _id: req.params.id });
      if (brand) {
        const newBrand = new Brands();
        newBrand._id = brand._id;
        newBrand.status= req.body.status;
        const filter = { _id: req.params.id };
        const updateBrand = await Brands.findOneAndUpdate(filter, newBrand, {
          new: true,
        });
  
        res.status(200).send(updateBrand);
      } else {
        res.status(404).send({
          error: "Brand doesn't exist!",
        });
      }
    }
    else
    {
      res.status(403).send({message:"Status is required"});
    }
   
  } catch (error) {
    res.status(500);
    res.send({ error: error });
  }
});



module.exports = brandRouter;
