const express = require("express");
const userController = require("../controllers/user.controller");
const { authenticateJWT, requireRoles } = require("../middlewares/auth");
const router = express.Router();
const { singleUpload } = require("../middlewares/uploadImage");

router.use(authenticateJWT);
// USER
router.get("/profile", userController.getProfile);
router.put("/profile", singleUpload("avatar"), userController.updateProfile);
router.put("/profile/change-password", userController.changePassword);
// ADMIN
router.get("/", requireRoles("admin"), userController.getAllUsers);
router.post(
  "/",
  requireRoles("admin"),
  singleUpload("avatar"),
  userController.createUser
);
router.put(
  "/:id",
  requireRoles("admin"),
  singleUpload("avatar"),
  userController.updateUser
);
router.delete("/:id", requireRoles("admin"), userController.deleteUser);

module.exports = router;
