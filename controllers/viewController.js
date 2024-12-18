const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");

exports.alerts = catchAsync(async (req, res, next) => {
  const { alert } = req.query;
  if (alert === "booking")
    res.locals.alert = `Your booking was successfuly. Please check your email for a confirmation.\nIf your booking does not show up here immediately, please come back later.`;
  next();
});

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
    "script-src 'self' https://api.mapbox.com https://cdn.jsdelivr.net https://js.stripe.com/; " +
      "style-src 'self' https://api.mapbox.com https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' https://api.mapbox.com data:; " +
      "connect-src 'self' https://api.mapbox.com https://events.mapbox.com; " + // Allow events.mapbox.com
      "frame-src 'self' https://api.mapbox.com https://js.stripe.com/; " +
      "worker-src 'self' blob:;"
  );
  next();
};

exports.getLoginForm = catchAsync(async (req, res, next) => {
  res.status(200).render("login", { title: "Log into your account" });
});

exports.getAccount = catchAsync(async (req, res, next) => {
  res.status(200).render("account", { title: "Account" });
});

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1. Find all bookings
  const bookings = await Booking.find({ user: req.user._id });

  //2. Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render("overview", { title: "My tours", tours });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { runValidators: true, new: true }
  );
  res
    .status(200)
    .render("account", { title: "Your account", user: updatedUser });
});
