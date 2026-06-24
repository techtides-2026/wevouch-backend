const mongoose = require("mongoose");

const BrandSchema = mongoose.Schema({
  name: {
      type: String,
      required: true
  },
  imageUrl: {
    type: String,
    required: false
  },
  status:{
    type: String,
    enum : ['active','inactive'],
    default: 'active',
    required: true
  },
  createdAt: Date
});   

module.exports = mongoose.model("Brand", BrandSchema);
