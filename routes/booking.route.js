const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");

router.post("/", bookingController.createBooking);
router.get("/user/:userId", bookingController.getBookingsByUser);
router.get("/", bookingController.getAllBookings);
router.put("/:id/status", bookingController.updateBookingStatus);

module.exports = router;
