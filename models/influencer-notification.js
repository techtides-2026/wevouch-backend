const mongoose = require("mongoose");

const InfluencerNotificationSchema = mongoose.Schema({
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
    cleared: {
        type: Boolean,
        default: false
    },
    influencer: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Influencers'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    }
}, {timestamps: true});

module.exports = mongoose.model("influencerNotifications", InfluencerNotificationSchema);