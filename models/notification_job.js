const mongoose = require("mongoose");

const NotificationJobSchema = mongoose.Schema({
    title: {
        type: String
    },
    message: {
        type: String
    },
    userCount: {
        type: Number
    },
    successCount: {
        type: Number
    },
    failureCount: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
}, {timestapms: true});



module.exports = mongoose.model("notificationJobs", NotificationJobSchema);
