const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const { authenticateJWT, requireRoles } = require("../middlewares/auth");

router.use(authenticateJWT);
router.post(
  "/",
  requireRoles("admin", "teacher", "student"),
  bookingController.createBooking
);

router.get(
  "/",
  requireRoles("admin", "teacher", "student"),
  bookingController.getAllBookings
);
router.get(
  "/:id",
  requireRoles("admin", "teacher", "student"),
  bookingController.getBookingDetail
);
router.put("/:id", requireRoles("admin"), bookingController.updateBooking);
router.put(
  "/:id/status",
  requireRoles("admin"),
  bookingController.updateBookingStatus
);
router.delete("/:id", requireRoles("admin"), bookingController.deleteBooking);
router.put(
  "/:id/cancel",
  authenticateJWT,
  requireRoles("admin", "teacher", "student"),
  bookingController.cancelBookingByUser
);

module.exports = router;
