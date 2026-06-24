const mongoose = require("mongoose");

const SettingsSchema = mongoose.Schema({
  companyName: {
    type: String,
    required: true
  },
  companyAddress:{
    type: String,
    required: true
  },
  emailId:{
    type: String,
    required: true
  },
  mobileNo:{
    type: Number,
    required: true
  },
  whatsappNo:{
    type: Number,
    required: true
  },
});



module.exports = mongoose.model("Settings", SettingsSchema);
