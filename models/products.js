const { Date } = require("mongoose");
const mongoose = require("mongoose");

const ExtendedWarrantySchema = mongoose.Schema({
  serviceProvider: {
    type: String,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  invoiceNo: {
    type: Number,
  },
  mobileNo: {
    type: String,
  },
  noOfYears: {
    type: String,
  },
  policyNumber: {
    type: String
  },
  extendedWarrantyImages: {
    type: Array
  }
});
const AmcSchema = mongoose.Schema({
  serviceProvider: {
    type: String,
  },
  startDate: {
    type: Date,
  },
  vendorNo: {
    type: String,
  },
  mobileNo: {
    type: String,
  },
  noOfYears: {
    type: String,
  },
  serviceDuration: {
    type: String,
    enum: ["quarterly","monthly","yearly","on demand"],
    default: "quarterly"
  },
  amcImages: {
    type: Array
  }
});
const ProductsSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  modelName: {
    type: String,
    required: false,
  },
  otherModelName: {
    type: Boolean,
    default: false
  },
  modelNo: {
    type: String,
    required: false,
  },
  otherModelNo: {
    type: Boolean,
    default: false
  },
  invoicePhotoUrl: {
    type: Array,
    required: false,
  },
  documentUrl: {
    type: String,
    required: false,
  },
  yearOfPurchase: {
    type: Number,
    required: false,
  },
  purchaseDate: {
    type: Date,
    required: false,
    default: undefined
  },
  warrantyPeriod: {
    type: Number,
  },
  serialNo: {
    type: String,
  },
  registeredMobileNo: {
    type: String,
  },
  productImagesUrl: {
    type: Array,
  },
  createdAt: {
    type: Date,
		default: Date.now,
  },
  uniqueId: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
    required: true,
  },
  users: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  brands: {
    type: String,
    trim: true,
    required: true,
  },
  otherBrand: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    trim: true,
    required: true,
  },
  otherCategory: {
    type: Boolean,
    default: false
  },
  subCategory: {
    type: String,
    trim: true,
    required: false,
  },
  otherSubCategory: {
    type: Boolean,
    default: false
  },
  extendedWarranty: ExtendedWarrantySchema,
  amcDetails: AmcSchema,
  outOfWarranty: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Product", ProductsSchema);
