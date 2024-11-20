const Booking = require("../models/bookingModel");
const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const factory = require("./handlerFactory");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1.Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);
  //2. Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${tour.name} Tour`,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
            description: tour.summary,
          },
          unit_amount: Math.round(tour.price * 100), // Convert price to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    // success_url: `${req.protocol}://${req.get("host")}/?tour=${
    //   req.params.tourId
    // }&user=${req.user._id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get("host")}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get("host")}/tours/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
  });

  //3. Create session as response
  res.status(200).json({
    status: "success",
    session,
  });

  //   next();
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   const { tour, user, price } = req.query;
//   if (!tour || !user || !price) return next();
//   await Booking.create({ tour, user, price });
//   res.redirect(`${req.originalUrl.split("?")[0]}`);
// });

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const email = session.customer_email;
  const user = (await User.findOne({ email }))._id;
  const price = session.line_items[0].total / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = catchAsync(async (req, res, next) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    try {
      console.log(event.type);
      await createBookingCheckout(event.data.object);
    } catch (err) {
      console.error("Error processing booking:", err);
    }
  }

  res.status(200).json({ received: true });
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
