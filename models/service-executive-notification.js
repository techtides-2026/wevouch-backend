const mongoose = require("mongoose");

const ServiceNotificationSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description:{
    type: String
  },
  createdDate:{
    type: Date,
		default: Date.now,
  },
  uniqueId:{
    type: String,
    required: false
  },
  supportExecutive:
  {type: mongoose.Schema.Types.ObjectId, ref: 'SupportExecutive'}
,
});



module.exports = mongoose.model("ServiceNotification", ServiceNotificationSchema);
