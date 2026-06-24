const mongoose = require("mongoose");
const crypto = require("crypto");

const InfluencerSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    email: {
        type: String,
        validate(value) {
            const pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z-.]+$/g
            if(!pattern.test(value)) {
                throw new Error("Wrong email format.")
            }
        },
        required: true
    },
    mobile: {
        type: String,
        validate: {
            validator: function(v) {
                return /\d{10}/.test(v);
            },
            message: props => `${props.value} is not a valid mobile number!`
        },
        required: false
    },
    password: {
        type: String
    },
    salt: String,
    socialMediaLinks: {
        type: Array
    },
    referralCode: {
        type: String,
        required: true
    },
    otherReferralCodes: {
        type: Array
    },
    videoUrls: {
        type: Array
    },
    status: {
        type: Boolean,
        default: true
    },
    otp: {
        type: Number,
        default: 1234
    },
    affiliatedCommission: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Method to set salt and hash the password for a user
InfluencerSchema.methods.setPassword = function (password) {
    // Creating a unique salt for a particular user
    this.salt = crypto.randomBytes(16).toString("hex");

    // Hashing user's salt and password with 1000 iterations,

    this.password = crypto
        .pbkdf2Sync(password, this.salt, 1000, 64, `sha512`)
        .toString(`hex`);
};

// Method to check the entered password is correct or not
InfluencerSchema.methods.validPassword = function (password) {
    var hash = crypto
        .pbkdf2Sync(password, this.salt, 1000, 64, `sha512`)
        .toString(`hex`);
    return this.password === hash;
};

module.exports = mongoose.model("Influencers", InfluencerSchema);
