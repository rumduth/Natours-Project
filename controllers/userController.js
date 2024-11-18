const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

function filterObj(body, ...fields) {
  const filterBody = {};
  for (let field of Object.keys(body)) {
    if (fields.includes(field)) filterBody[field] = body[field];
  }
  return filterBody;
}

exports.updateMe = catchAsync(async (req, res, next) => {
  //1. Create and error if use tries to update the password
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError("You cannot update the password in this route", 400)
    );

  //2. Update user document
  const filterBody = filterObj(req.body, "name", "email");
  const updateUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
    runValidators: true,
    new: true,
  });
  res.status(200).json({ status: "success", data: { user: updateUser } });
  next();
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });
  res.status(204).json({ status: "success", data: null });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use sign up instead",
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

//Do not update password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
