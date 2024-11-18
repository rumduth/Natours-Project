const mongoose = require("mongoose");
const Tour = require("./tourModel");
const User = require("./userModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty"],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating must not be greater than 5."],
      required: [true, "Rating must be entered"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate("user", "name photo");
  next();
});

reviewSchema.statics.caclAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRatings: { $avg: "$rating" },
      },
    },
  ]).exec();
  if (!stats.length) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
    return;
  }
  const { _id, avgRatings, nRating } = stats[0];
  await Tour.findByIdAndUpdate(_id, {
    ratingsAverage: avgRatings,
    ratingsQuantity: nRating,
  });
};

reviewSchema.post("save", async function () {
  await this.constructor.caclAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  let copy_query = this.clone();
  this.r = await copy_query.findOne();
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.caclAverageRatings(this.r.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
