const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { authenticateJWT } = require("../middlewares/auth.middleware");
router.use(authenticateJWT);
router.get("/", notificationController.getNotifications);
router.put("/:id/read", notificationController.markAsRead);

module.exports = router;
