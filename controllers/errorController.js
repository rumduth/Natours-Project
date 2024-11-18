const AppError = require("../utils/appError");

function handleCastErrorDB(err) {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
}
function handleDuplicateFieldsDB(err) {
  const message = `Duplicate field value ${err.errmsg}. Please use another value`;
  return new AppError(message, 400);
}
function handleValidationErrorDB(err) {
  const message = `${err.name}: ${err.message}`;
  return new AppError(message, 400);
}

function handleJsonWebTokenError() {
  const message = `Invalid Token. Please log in again!`;
  return new AppError(message, 401);
}

function handleJWTExpired() {
  return new AppError("Your token has expired!. Please log in again", 401);
}

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res
      .status(err.statusCode)
      .render("error", { title: "Page not found", msg: err.message });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational)
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    else
      res
        .status(500)
        .json({ status: "error", message: "Something went very wrong!" });
  } else {
    if (err.isOperational)
      res.status(err.statusCode).render("error", {
        title: "Page not found",
        msg: "The page is not available",
      });
    else
      res.status(500).render("error", {
        title: "Page not found",
        msg: "Please try again later",
      });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.NODE_ENV === "development") sendErrorDev(err, req, res);
  else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;
    if (err.name === "CastError") error = handleCastErrorDB(err);
    if (err.code == 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === "ValidationError") error = handleValidationErrorDB(err);
    if (err.name === "JsonWebTokenError") error = handleJsonWebTokenError();
    if (err.name === "TokenExpiredError") error = handleJWTExpired();

    sendErrorProd(error, req, res);
  }
};
