const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();
const { singleUpload } = require("../middlewares/uploadImage");

router.post("/register", singleUpload("avatar"), authController.register);
router.post("/login", authController.login);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
module.exports = router;
