const Razorpay = require('razorpay');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Your Key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET // Your Key Secret
});
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.tourId);
  const options = {
    amount: tour.price * 100,
    currency: 'INR',
    receipt: `receipt_${tour.id}`,
    notes: {
      tourId: req.params.tourId,
      userId: req.user.id,
      tourName: tour.name
    }
  };

  const order = await razorpay.orders.create(options);
  res.status(200).json({
    status: 'success',
    // We send the order object and tour data so the frontend can build the modal
    data: {
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      tour: {
        name: tour.name,
        summary: tour.summary,
        imageCover: tour.imageCover
      },
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    }
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only temporary, because it's unsecure: everyone can make bookings without paying
  const { tour, user, price } = req.query;
  if (!tour || !user || !price) return next();
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
