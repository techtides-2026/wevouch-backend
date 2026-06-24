const express = require("express");
const mongoose = require('mongoose');

const SubCategories = require("../models/sub-category");
const subCategoryRoute = express.Router();

subCategoryRoute.get("/list", async (req, res) => {
  const subCategories = await SubCategories.find().sort({"createdAt": -1}).populate("category");
  res.send(subCategories);
});

subCategoryRoute.post("/add", async (req, res) => {
  try {
    if (req.body.name && req.body.categoryId) {
      const subCategory = await SubCategories.findOne({ name: req.body.name });
      if (subCategory) {
        return res.status(403).send({
          message: "A Sub category with a similar name exists.",
        });
      }
      let newCategory = new SubCategories();

      // Initialize new Sub Category object with request data
      (newCategory.name = req.body.name),
      (newCategory.imageUrl = req.body.imageUrl),
      (newCategory.category = mongoose.Types.ObjectId(req.body.categoryId));
        (newCategory.description = req.body.description);

        if(req.body.status)
        {
          newCategory.status= req.body.status;
        }
        const sDate = new Date();
        (newCategory.createdAt = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          1,
          0,
          0
        ));
      // Save new Sub Category object to database
      newCategory.save((err) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add sub category.",
          });
        } else {
          return res.status(200).send({
            message: "Sub Category added successfully.",
          });
        }
      });
    } else {
      res.status(403).send({
        message: "Sub Category Name and Category Id are required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

subCategoryRoute.get("/get/:id", async (req, res) => {
  try {
    const subCategory = await SubCategories.findOne({ _id: req.params.id }).populate("category");
    if (subCategory) {
      res.status(200).send(subCategory);
    } else {
      res.status(404).send({
        error: "Sub Category doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Sub Category doesn't exist!" });
  }
});
subCategoryRoute.get("/get-by-category/:id", async (req, res) => {
  try {
    const subCategory = await SubCategories.find({ category: req.params.id });
    if (subCategory) {
      res.status(200).send(subCategory);
    } else {
      res.status(404).send({
        error: "Sub Category doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Sub Category doesn't exist!" });
  }
});

subCategoryRoute.patch("/update/:id", async (req, res) => {
  try {
    const category = await SubCategories.findOne({ _id: req.params.id });
    if (category) {
      if (req.body.name) {
        category.name = req.body.name;
      }
      if (req.body.description) {
        category.description = req.body.description;
      }
      if (req.body.categoryId) {
        category.category = mongoose.Types.ObjectId(req.body.categoryId);
      }
      const categoryExists = await SubCategories.findOne({ name: req.body.name });
      if(categoryExists && categoryExists._id.toString() !== req.params.id)
      {
        return res.status(403).send({
            message: "A sub category with a similar name exists.",
          });
      }

      await category.save();
      res.status(200).send(category);
    } else {
      res.status(404).send({
        error: "Sub Category doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Sub Category doesn't exist!" });
  }
});

subCategoryRoute.delete("/delete/:id", async (req, res) => {
  try {
    const category = await SubCategories.findOne({ _id: req.params.id });
    if (category) {
      await SubCategories.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Sub Category doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Sub Category doesn't exist!" });
  }
});
subCategoryRoute.patch("/toggle-sub-category-status/:id", async (req, res) => {
  try {
    if(req.body.status)
    {
      let category = await SubCategories.findOne({ _id: req.params.id });
      if (category) {
        const newCategory = new SubCategories();
        newCategory._id = category._id;
        newCategory.status= req.body.status;
        const filter = { _id: req.params.id };
        const updateCategory = await SubCategories.findOneAndUpdate(filter, newCategory, {
          new: true,
        });
  
        res.status(200).send(updateCategory);
      } else {
        res.status(404).send({
          error: "Sub Category doesn't exist!",
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

module.exports = subCategoryRoute;
