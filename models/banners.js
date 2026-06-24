const mongoose = require("mongoose");

const BannerSchema = mongoose.Schema({
  name: {
      type: String,
      required: true
  },
  imageUrl: {
    type: String,
    required: false
  },
  createdAt: Date
});   

module.exports = mongoose.model("Banner", BannerSchema);
