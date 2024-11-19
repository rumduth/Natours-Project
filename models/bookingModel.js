const mongoose = require("mongoose");

const bookingScheme = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: "Tour",
    required: [true, "Booking must belong to a tour!"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Booking must belong to a user!"],
  },
  price: {
    type: Number,
    required: [true, "Booking must have a price!"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingScheme.pre(/^find/, function (next) {
  this.populate("user", "name").populate("tour", "name");
  next();
});

const Booking = mongoose.model("Booking", bookingScheme);

module.exports = Booking;
