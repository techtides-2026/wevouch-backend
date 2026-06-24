const mongoose = require("mongoose");

const InfluencerDataSchema = mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: [true, 'please provide a valid user']
    },
    influencer:{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Influencers", 
        required: [true, 'Please provide a valid influencer']
    },
    influencerRefCode: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("InfluencerData", InfluencerDataSchema);
