const mongoose = require("mongoose");

const AddressSchema = mongoose.Schema({
  addressLine1: {
      type: String,
      required: false
  },
  addressLine2: {
    type: String,
    required: false
  },
  location:{
    type: String,
    required: false
  },
  latitude:{
      type:String,
      required: false
  },
  longitude:{
    type:String,
    required: false
},
state:{
    type:String,
    required: false
},
city:{
    type:String,
    required: false
},
user:
  {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
,
country:{
    type:String,
    required: false
},
pin:{
    type:String,
    required: false
},
  createdAt: Date
});   

module.exports = mongoose.model("Address", AddressSchema);
