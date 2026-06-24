const mongoose = require("mongoose");

const TicketSchema = mongoose.Schema({
  products: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  issueType: {
    type: String,
    required: true,
  },
  functionType: {
    type: String,
    required: true,
  },
  transportationType: {
    type: String,
    required: false,
  },
  selectedDate: {
    type: String,
    required: true,
  },
  uniqueId: {
    type: String,
    required: true,
  },
  selectedTime: {
    type: String,
    required: false,
  },
  description: String,
  createdAt: {
    type: Date,
		default: Date.now(),
  },
  srn: {
    type: String,
    trim: true
  },
  srnAddedOn: {
    type: Date
  },
  status: {
    type: String,
    enum: ["new", "ongoing", "completed", "cancelled"],
    default: "new",
    required: true,
  },
  multipleAddress: [
    {
      type: String,
    },
  ],
  users: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  executive: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SupportExecutive",
    required: false,
  },
  address: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address",
    required: false,
  },
  rating: {
    type: Number
  },
  feedback: {
    type: String
  },
  brandRating: {
    type: Number
  },
  brandFeedback: {
    type: String
  }
});

TicketSchema.pre('findOneAndUpdate', async function (next) {
  try {
    if (this._update.srn) {
      this._update.srnAddedOn = Date.now();
    }
    next()
  } catch (error) {
    next(error)
  }
})

TicketSchema.pre('updateOne', async function (next) {
  try {
    if (this._update.srn) {
      this._update.srnAddedOn = Date.now();
    }
    next()
  } catch (error) {
    next(error)
  }
})

module.exports = mongoose.model("Ticket", TicketSchema);
