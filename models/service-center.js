const mongoose = require("mongoose");


const ServiceCenterSchema = mongoose.Schema({
  centerName: {
    type: String,
    required: true,
  },
  createdAt: Date,
  uniqueId:{
    type: String,
    required: true
  },
  city: String,
  address: String,
  pin: String,
  mobile: String,
  email: String,
  contactPerson: String,
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

module.exports = mongoose.model("ServiceCenter", ServiceCenterSchema);
