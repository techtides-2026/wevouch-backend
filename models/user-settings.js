const mongoose = require("mongoose");

const UserSettingsSchema = mongoose.Schema({
    isWhatsappNotification: {
        type: Boolean,
        default: true,
    },
    isEmailNotification: {
        type: Boolean,
        default: true,
    },
    isSMSNotification: {
        type: Boolean,
        default: true,
    },
    isInAppNotification: {
        type: Boolean,
        default: true,
    },
    isEmailNewsLetter: {
        type: Boolean,
        default: true,
    },
    isConnectFb: {
        type: Boolean,
        default: true,
    },
    isTwoFactorAuth: {
        type: Boolean,
        default: true,
    },
    user:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }

}, {timestamps: true});   

module.exports = mongoose.model("UserSetting", UserSettingsSchema);
