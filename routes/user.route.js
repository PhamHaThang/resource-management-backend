const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticateJWT, requireRoles } = require("../middlewares/auth");
const router = express.Router();
router.use(authenticateJWT);
// ADMIN
router.get("/", requireRoles("admin"), userController.getAllUsers);
router.put("/:id", requireRoles("admin"), userController.updateUser);
router.put(
  "/:id/status",
  requireRoles("admin"),
  userController.toggleUserStatus
);

// USER
router.get(
  "/profile",
  requireRoles("admin", "teacher", "student"),
  userController.getProfile
);
router.put(
  "/profile",
  requireRoles("admin", "teacher", "student"),
  userController.updateProfile
);
router.put(
  "/profile/change-password",
  requireRoles("admin", "teacher", "student"),
  userController.changePassword
);

module.exports = router;
