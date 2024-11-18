const Tour = require("../models/tourModel");
const Review = require("../models/reviewModel");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getOverview = catchAsync(async (req, res, next) => {
  //1. Get Tour data from the collection
  const tours = await Tour.find();
  //2. Build the template

  //3. Render that template using the tour data from step 1
  res.status(200).render("overview", { title: "All tour", tours: tours });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const tour = await Tour.findOne({ slug }).populate(
    "reviews",
    "rating tour user review"
  );
  if (!tour) {
    return next(new AppError("There is no tour with that name", 404));
  }
  res.status(200).render("tour", { tour });
});

exports.setContentSecurityPolicy = (req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' https://api.mapbox.com https://cdn.jsdelivr.net; " +
      "style-src 'self' https://api.mapbox.com https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' https://api.mapbox.com data:; " +
      "connect-src 'self' https://api.mapbox.com https://events.mapbox.com; " + // Allow events.mapbox.com
      "frame-src 'self' https://api.mapbox.com; " +
      "worker-src 'self' blob:;"
  );
  next();
};

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render("login", { title: "Log into your account" });
});
