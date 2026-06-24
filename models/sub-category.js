const mongoose = require("mongoose");

const SubCategorySchema = mongoose.Schema({
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
  createdAt: Date,
  category:
  {type: mongoose.Schema.Types.ObjectId, ref: 'Category'}
,
});



module.exports = mongoose.model("SubCategory", SubCategorySchema);
