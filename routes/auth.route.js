const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();
const { singleUpload } = require("../middlewares/uploadImage.middleware");
const authMiddleware = require("../middlewares/auth.middleware");

router.post(
  "/register",
  singleUpload("avatar"),
  authMiddleware.validateRegister,
  authController.register
);
router.post("/login", authMiddleware.validateLogin, authController.login);

router.post(
  "/forgot-password",
  authMiddleware.validateForgotPassword,
  authController.forgotPassword
);
router.post(
  "/reset-password",
  authMiddleware.validateResetPassword,
  authController.resetPassword
);
module.exports = router;
