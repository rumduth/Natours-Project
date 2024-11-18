const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc)
      return next(new AppError(`No document found with ${req.params.id}`, 404));
    res.status(204).json({
      status: "success",
      data: null,
    });
  });
};

exports.createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        data: newDoc,
      },
    });
  });
};

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc)
      return next(new AppError(`No doc found with ${req.params.id}`, 404));
    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });
};

exports.getOne = (Model, popOptions) => {
  return catchAsync(async (req, res, next) => {
    const query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);
    const doc = await query;
    if (!doc)
      return next(new AppError(`No doc found with ${req.params.id}`, 404));
    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });
};

exports.getAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    //To allow for nested GET reviews on tour
    const { tourId } = req.params;
    const filterOptions = {};
    if (tourId) filterOptions.tour = tourId;

    const features = new APIFeatures(Model.find(filterOptions), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query.exec();
    res.status(200).json({
      status: "success",
      results: docs.length,
      data: {
        docs,
      },
    });
  });
};
