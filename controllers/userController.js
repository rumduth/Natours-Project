const multer = require("multer");
const sharp = require("sharp");
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

// const multerStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/img/users");
//   },
//   filename: function (req, file, cb) {
//     const extension = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${extension}`);
//   },
// });

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Not an image! Please upload only images", 400), false);
};
const multerStorage = multer.memoryStorage();

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  const filename = `public/img/users/user-${req.user._id}-${Date.now()}`;
  req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`${filename}.jpeg`, (err, info) => {});
  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //1. Create and error if use tries to update the password
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError("You cannot update the password in this route", 400)
    );

  //2. Update user document
  const filterBody = filterObj(req.body, "name", "email");
  if (req.file) filterBody.photo = req.file.filename;

  const updateUser = await User.findByIdAndUpdate(req.user._id, filterBody, {
    runValidators: true,
    new: true,
  });
  return res
    .status(200)
    .json({ status: "success", data: { user: updateUser } });
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
