const mongoose = require("mongoose");

const OnesignalUserSchema = mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    default: undefined
  },
  uuid: {
    type: String
  },
  fcmToken: {
    type: String
  },
  onesignalPlayerId: {
    type: String
  },
  deviceType: {
    type: Number
  }
}, {timestamps: true});

module.exports = mongoose.model("OnesignalUsers", OnesignalUserSchema);