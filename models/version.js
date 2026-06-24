const mongoose = require("mongoose");

const VersionSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: false
  }
}, { timestamps: true });   

module.exports = mongoose.model("version", VersionSchema);
