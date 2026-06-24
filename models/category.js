const mongoose = require("mongoose");

const CategorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description:{
      type: String
  },
  imageUrl: String,
  status:{
    type: String,
    enum : ['active','inactive'],
    default: 'active',
    required: true
  },
  createdAt: Date
});



module.exports = mongoose.model("Category", CategorySchema);
