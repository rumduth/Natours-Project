const path = require("path");

const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSatinize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const compression = require("compression");
const AppError = require("./utils/appError");

const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRouters");
const reviewRouter = require("./routes/reviewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const viewRouter = require("./routes/viewRoutes");

const bookingController = require("./controllers/bookingController");
const app = express();

app.enable("trust proxy");
app.use(cors());
app.options("*", cors());

//Setting Pug Engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//Serving static files
app.use(express.static(path.join(__dirname, "public")));

//1. Global Middleware

//SET Security HTTP headers
app.use(helmet());

process.env.NODE_ENV === "development" && app.use(morgan("dev"));

//LIMIT requests from same IP
const limiter = rateLimit({
  limit: 100,
  windowMs: 1 * 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour",
});

app.use("/api", limiter);
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  bookingController.webhookCheckout
);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
//Parse the data that come from a url encoded form
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

//Data sanitization against NoSQL query injection
app.use(mongoSatinize());

//Data sanitization against XSS
app.use(xss());

//Prevent HTTP Parameter Pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

//2. Routes

app.use(compression());

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

//3. Not found any routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//4. Error Handling
app.use(globalErrorHandler);

module.exports = app;
