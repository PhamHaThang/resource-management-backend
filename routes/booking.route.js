const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const { authenticateJWT, requireRoles } = require("../middlewares/auth");

router.use(authenticateJWT);
// USER
router.get("/", bookingController.getAllBookings);
router.get("/:id", bookingController.getBookingDetail);
router.post("/", bookingController.createBooking);

// ADMIN
router.put("/:id", requireRoles("admin"), bookingController.updateBooking);
router.put(
  "/:id/status",
  requireRoles("admin"),
  bookingController.updateBookingStatus
);
router.delete("/:id", requireRoles("admin"), bookingController.deleteBooking);
router.put("/:id/cancel", bookingController.cancelBookingByUser);

module.exports = router;
