const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("./../models/userModel");
const catchAsync = require("../utils/catchAsync");
const Email = require(".././utils/email");
const AppError = require("../utils/appError");
const crypto = require("crypto");

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

function createSendToken(user, statusCode, res, req) {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    role = "user",
    photo = "default.jpg",
  } = req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role,
    photo,
  });

  const url = `${req.protocol}://${req.get("host")}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1. Check if email and password exists
  if (!email || !password)
    return next(new AppError("Please provide email and password!", 400));
  //2. Check if user exists and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password)))
    return next(new AppError("Incorrect email or password", 401));
  //3. send token to client

  return createSendToken(user, 200, res, req);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1. Getting token and check if it's there

  let token = undefined;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  )
    token = req.headers.authorization.split(" ")[1];
  else if (req.headers.cookie && req.headers.cookie.startsWith("jwt"))
    token = req.headers.cookie.split("=")[1];

  if (!token)
    return next(
      new AppError(`You're not logged in!. Please log in to get access`, 401)
    );

  //2. Verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3. Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        "The user belonging to this account does no longer exist",
        401
      )
    );

  //4. Check if the user changes password after the JWT was issued
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError(
        "User recently changed the password. Please log in again.",
        401
      )
    );
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1: Get user email based on the Posted Email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError("There is no user with email address", 404));

  //2: Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3:Send it to the user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    return res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("There was an error sending the email. Try again later", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1: Get user based on the token
  const { token } = req.params;
  const { password, passwordConfirm } = req.body;
  if (!token || !password || !passwordConfirm)
    return next(
      new AppError(
        "You don't provide at least one of: token, password, passwordConfirm",
        400
      )
    );

  const hash_token = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ passwordResetToken: hash_token });
  if (!user)
    return next(new AppError("There is no user belong to the token", 400));

  //2. If token has not expired, and there is a user, set the new password
  let curTime = Date.now();
  if (curTime > user.passwordResetExpires)
    return next(
      new AppError(
        "The token is invalid or expired. Please request the new one",
        401
      )
    );

  //3. Update changePasswordAt property for the user
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  //4. Log the user in. Send the JWT to client
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. Get user from collection
  let user = await User.findById(req.user._id).select("+password");
  //2. Check if Posted current password is correct
  const { currentPassword, password, passwordConfirm } = req.body;
  if (!currentPassword || !password || !passwordConfirm)
    return next(
      new AppError("You don't provide all the required field. Try again", 400)
    );
  let correctPassword = await user.correctPassword(currentPassword);
  if (!correctPassword) return next(new AppError("Incorrect Password", 400));

  //3. Update the password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  //4. send updated JWT.
  createSendToken(user, 201, res);
});

//Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  try {
    //1. Getting token and check if it's there
    let token = undefined;
    if (req.headers.cookie && req.headers.cookie.startsWith("jwt"))
      token = req.headers.cookie.split("=")[1];

    //2. Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //3. Check if the user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return next();

    //4. Check if the user changes password after the JWT was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) return next();

    //There is a LOGGED IN USER
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    next();
  }
};
