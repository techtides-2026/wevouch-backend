const mongoose = require("mongoose");

const NotificationJobDetailSchema = mongoose.Schema({
    notificationJob: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "notificationJobs"
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    name: {
        type: String
    },
    mobile: {
        type: String
    },
    token: {
        type: String
    },
    isSuccess: {
        type: Boolean,
        default: false
    },
    refId: {
        type: String
    },
    message: {
        type: String
    }
}, {timestapms: true});



module.exports = mongoose.model("notificationJobDetails", NotificationJobDetailSchema);
