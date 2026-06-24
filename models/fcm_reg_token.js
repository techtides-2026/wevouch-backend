const mongoose = require("mongoose");

const fcmTokenSchema = mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    token: {
        type: String,
    }
}, { timestamps: true });   

module.exports = mongoose.model("fcmTokens", fcmTokenSchema);
