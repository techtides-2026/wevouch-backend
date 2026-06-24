const mongoose = require("mongoose");


const ModelManagementSchema = mongoose.Schema({
  modelName: {
    type: String,
    required: true,
  },
  createdAt: Date,
  uniqueId:{
    type: String,
    required: true
  },
  modelId: {
    type: String,
    required: true,
  },
  status:{
    type: String,
    enum : ['active','inactive'],
    default: 'active',
    required: true
  },
  brands:
    {type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true}
  ,
  category:
    {type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true}
  ,
  subCategory:
    {type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true}
});

module.exports = mongoose.model("ModelManagement", ModelManagementSchema);
