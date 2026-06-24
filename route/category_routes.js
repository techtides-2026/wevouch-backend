const express = require("express");
const Categories = require("../models/category");
const categoryRoute = express.Router();

categoryRoute.get("/list", async (req, res) => {
  const categories = await Categories.find().sort({"createdAt": -1});
  res.send(categories);
});

categoryRoute.post("/add", async (req, res) => {
  try {
    if (req.body.name) {
      const category = await Categories.findOne({ name: req.body.name });
      if (category) {
        return res.status(403).send({
          message: "A category with a similar name exists.",
        });
      }
      let newCategory = new Categories();

      // Initialize new Category object with request data
      (newCategory.name = req.body.name),
      (newCategory.imageUrl = req.body.imageUrl),
        (newCategory.description = req.body.description);
        const sDate = new Date();
        (newCategory.createdAt = new Date(
          sDate.getFullYear(),
          sDate.getMonth(),
          sDate.getDate(),
          1,
          0,
          0
        ));
      if(req.body.status)
      {
        newCategory.status= req.body.status;
      }

      // Save new Category object to database
      newCategory.save((err) => {
        if (err) {
          return res.status(400).send({
            message: "Failed to add category.",
          });
        } else {
          return res.status(200).send({
            message: "Category added successfully.",
          });
        }
      });
    } else {
      res.status(403).send({
        message: "Category Name is required.",
      });
    }
  } catch (error) {
    res.status(500).send({
      message: error,
    });
  }
});

categoryRoute.get("/get/:id", async (req, res) => {
  try {
    const category = await Categories.findOne({ _id: req.params.id });
    if (category) {
      res.status(200).send(category);
    } else {
      res.status(404).send({
        error: "Category doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Category doesn't exist!" });
  }
});

categoryRoute.patch("/update/:id", async (req, res) => {
  try {
    const category = await Categories.findOne({ _id: req.params.id });
    if (category) {
      if (req.body.name) {
        category.name = req.body.name;
      }
      if (req.body.description) {
        category.description = req.body.description;
      }
      const categoryExists = await Categories.findOne({ name: req.body.name });
      if(categoryExists && categoryExists._id.toString() !== req.params.id)
      {
        return res.status(403).send({
            message: "A category with a similar name exists.",
          });
      }

      await category.save();
      res.status(200).send(category);
    } else {
      res.status(404).send({
        error: "Category doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Category doesn't exist!" });
  }
});

categoryRoute.delete("/delete/:id", async (req, res) => {
  try {
    const category = await Categories.findOne({ _id: req.params.id });
    if (category) {
      await Categories.deleteOne({ _id: req.params.id });
      res.status(200).send();
    } else {
      res.status(404).send({
        error: "Category doesn't exist!",
      });
    }
  } catch {
    res.status(404);
    res.send({ error: "Category doesn't exist!" });
  }
});

categoryRoute.patch("/toggle-category-status/:id", async (req, res) => {
  try {
    if(req.body.status)
    {
      let category = await Categories.findOne({ _id: req.params.id });
      if (category) {
        const newCategory = new Categories();
        newCategory._id = category._id;
        newCategory.status= req.body.status;
        const filter = { _id: req.params.id };
        const updateCategory = await Categories.findOneAndUpdate(filter, newCategory, {
          new: true,
        });
  
        res.status(200).send(updateCategory);
      } else {
        res.status(404).send({
          error: "Category doesn't exist!",
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

module.exports = categoryRoute;
