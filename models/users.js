const mongoose = require("mongoose");
const crypto = require("crypto");
const { Date } = require("mongoose");
const { Boolean } = require("mongoose/lib/schema/index");

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: false,
    default: '',
    trim: true,
    validate(value) {
      const pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z-.]+$/g
      if(value!= '' && !pattern.test(value)) {
        throw new Error("Wrong email format.")
      }
    },
    unique: true
  },
  mobile: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return /\d{10}/.test(v);
      },
      message: props => `${props.value} is not a valid mobile number!`
    },
    required: false
  },
  role: String,
  image: String,
  address: String,
  country: String,
  state: String,
  city: String,
  pin: String,
  dob: String,
  gender: String,
  hash: String,
  salt: String,
  landMark: String,
  socialId: String,
  uniqueId:{
    type: String,
    required: true
  },
  age:String,
  status:{
    type: String,
    enum : ['active','inactive'],
    default: 'active',
    required: true
  },
  generatedOtp: String,
  remainingTicketCount:{
    type: Number,
    required: false,
    default: 0
  },
  ticketAddedCount: {
    type: Number,
    required: false,
    default: 0
  },
  ticketExpiryDate: {
    type: Date
  },
  referralCode: String,
  subscription: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subscription'
  },
  uuid: {
    type: String
  },
  fcmToken: {
    type: String
  },
  player_id: {
    type: String
  },
  deviceType: {
    type: Number
  },
  mobile_otp: {
    type: Number,
    default: 9405
  },
  email_otp: {
    type: Number,
    default: 9405
  },
  is_mobile_verified: {
    type: Boolean,
    default: false, 
  },
  is_email_verified: {
    type: Boolean,
    default: false, 
  },
  login_otp: {
    type: Number,
    default: 9405
  },
  location: {
    type: String,
    trim: true
  },
  lat: {
    type: String,
    trim: true
  },
  lng: {
    type: String,
    trim: true
  },
  isFirstTime: {
    type: Boolean,
    default: true
  },
  isFirstProductAdded: {
    type: Boolean,
    default: false
  },
  isProductAdded: {type: Boolean, default: false},
  totalProductAdded: {type: Number, default: 0},
  isAddedViaRefferal: {
    type: Boolean,
    default: false
  },
  isAddressAdded: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  verifiedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Method to set salt and hash the password for a user
UserSchema.methods.setPassword = function (password) {
  // Creating a unique salt for a particular user
  this.salt = crypto.randomBytes(16).toString("hex");

  // Hashing user's salt and password with 1000 iterations,

  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, `sha512`)
    .toString(`hex`);
};

// Method to check the entered password is correct or not
UserSchema.methods.validPassword = function (password) {
  var hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, `sha512`)
    .toString(`hex`);
  return this.hash === hash;
};

module.exports = mongoose.model("User", UserSchema);
