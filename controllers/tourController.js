const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) cb(null, true);
  else cb(new AppError("Not an image! Please upload only images", 400), false);
};
const multerStorage = multer.memoryStorage();

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover && !req.files.images) return next();
  //1. Cover image
  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(
      `${__dirname}/../public/img/tours/${imageCoverFilename}`,
      (err, info) => {}
    );
  req.body.imageCover = imageCoverFilename;

  //2. Image
  req.body.images = [];
  for (let i = 0; i < req.files.images.length; i++) {
    const imageFilename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
    sharp(req.files.images[i].buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(
        `${__dirname}/../public/img/tours/${imageFilename}`,
        (err, info) => {}
      );
    req.body.images.push(imageFilename);
  }
  next();
});

exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

// upload.array("images", 5);

exports.getTop5CheapTours = async (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, "reviews");
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTours: {
          $sum: 1,
        },
        numRatings: {
          $sum: "$ratingsQuantity",
        },
        avgRating: {
          $avg: "$ratingsAverage",
        },
        avgPrice: {
          $avg: "$price",
        },
        minPrice: {
          $min: "$price",
        },
        maxPrice: {
          $max: "$price",
        },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]).exec();

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const { year } = req.params;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: {
          $month: "$startDates",
        },
        numToursStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: {
        _id: false,
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]).exec();

  res.status(200).json({ status: "success", data: { plan } });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng?.split(",");
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6400;
  if (!lat || !lng)
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radius],
      },
    },
  });
  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng?.split(",");
  if (!lat || !lng)
    return next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng * 1, lat * 1] },
        distanceField: "distance",
        spherical: true,
        distanceMultiplier: unit === "km" ? 0.001 : 0.000621371,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
        _id: 0,
      },
    },
    {
      $sort: { distance: 1 },
    },
  ]).exec();
  res.status(200).json({
    status: "success",
    results: distances.length,
    data: {
      distances,
    },
  });
});
