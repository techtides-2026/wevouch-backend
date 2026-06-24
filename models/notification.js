const mongoose = require("mongoose");

const NotificationSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description:{
    type: String
  },
  status: {
    type: Boolean,
    default: true
  },
  createdDate:{
    type: Date,
		default: Date.now(),
  },
  uniqueId:{
    type: String,
    required: false
  },
  cleared: {
    type: Boolean,
    default: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  }
,
});



module.exports = mongoose.model("Notification", NotificationSchema);
