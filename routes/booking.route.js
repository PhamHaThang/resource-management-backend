const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const {
  authenticateJWT,
  requireRoles,
} = require("../middlewares/auth.middleware");
const bookingMiddleware = require("../middlewares/booking.middleware");
router.use(authenticateJWT);
// USER
router.get("/", bookingController.getAllBookings);
router.get("/:id", bookingController.getBookingDetail);
router.post(
  "/",
  bookingMiddleware.validateCreateBooking,
  bookingController.createBooking
);
router.put("/:id/cancel", bookingController.cancelBookingByUser);

// ADMIN
router.put(
  "/:id",
  requireRoles("admin"),
  bookingMiddleware.validateUpdateBooking,
  bookingController.updateBooking
);
router.put(
  "/:id/status",
  requireRoles("admin"),
  bookingMiddleware.validateUpdateBookingStatus,
  bookingController.updateBookingStatus
);
router.delete("/:id", requireRoles("admin"), bookingController.deleteBooking);

module.exports = router;
