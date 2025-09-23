const express = require("express");
const resourceController = require("../controllers/resource.controller");
const {
  authenticateJWT,
  requireRoles,
} = require("../middlewares/auth.middleware");
const { multipleUpload } = require("../middlewares/uploadImage.middleware");
const router = express.Router();
// USER
router.get("/", resourceController.getAllResources);
router.get("/:id", resourceController.getResourceById);
// ADMIN
router.post(
  "/",
  authenticateJWT,
  requireRoles("admin"),
  multipleUpload("images"),
  resourceController.createResource
);
router.put(
  "/:id",
  authenticateJWT,
  requireRoles("admin"),
  multipleUpload("images"),
  resourceController.updateResource
);
router.delete(
  "/:id",
  authenticateJWT,
  requireRoles("admin"),
  resourceController.deleteResource
);
module.exports = router;
