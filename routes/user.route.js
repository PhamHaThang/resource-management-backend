const express = require("express");
const userController = require("../controllers/user.controller");
const {
  authenticateJWT,
  requireRoles,
} = require("../middlewares/auth.middleware");

const { singleUpload } = require("../middlewares/uploadImage.middleware");
const userMiddleware = require("../middlewares/user.middleware");
const router = express.Router();

router.use(authenticateJWT);
// USER
router.get("/profile", userController.getProfile);
router.put(
  "/profile",
  singleUpload("avatar"),
  userMiddleware.validateUpdateProfile,
  userController.updateProfile
);
router.put(
  "/profile/change-password",
  userMiddleware.validateChangePassword,
  userController.changePassword
);
// ADMIN
router.get("/", requireRoles("admin"), userController.getAllUsers);
router.post(
  "/",
  requireRoles("admin"),
  singleUpload("avatar"),
  userMiddleware.validateCreateUser,
  userController.createUser
);
router.put(
  "/:id",
  requireRoles("admin"),
  singleUpload("avatar"),
  userMiddleware.validateUpdateUser,
  userController.updateUser
);
router.delete("/:id", requireRoles("admin"), userController.deleteUser);

module.exports = router;
