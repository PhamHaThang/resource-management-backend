const express = require("express");
const resourceController = require("../controllers/resource.controller");
const {
  authenticateJWT,
  requireRoles,
} = require("../middlewares/auth.middleware");
const { multipleUpload } = require("../middlewares/uploadImage.middleware");
const resourceMiddleware = require("../middlewares/resource.middleware");
const router = express.Router();
router.use(authenticateJWT);
// USER
router.get("/", resourceController.getAllResources);
router.get("/:id", resourceController.getResourceById);
// ADMIN
router.post(
  "/",
  requireRoles("admin"),
  multipleUpload("images"),
  resourceMiddleware.validateCreateResource,
  resourceController.createResource
);
router.put(
  "/:id",
  requireRoles("admin"),
  multipleUpload("images"),
  resourceMiddleware.validateUpdateResource,
  resourceController.updateResource
);
router.delete(
  "/:id",
  authenticateJWT,
  requireRoles("admin"),
  resourceController.deleteResource
);
module.exports = router;
