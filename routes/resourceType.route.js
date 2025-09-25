const express = require("express");
const router = express.Router();
const resourceTypeController = require("../controllers/resourceType.controller");
const {
  authenticateJWT,
  requireRoles,
} = require("../middlewares/auth.middleware");
const resourceTypeMiddleware = require("../middlewares/resourceType.middleware");
router.use(authenticateJWT);
router.post(
  "/",
  requireRoles("admin"),
  resourceTypeMiddleware.validateCreateResourceType,
  resourceTypeController.createResourceType
);
router.get("/", resourceTypeController.getAllResourceTypes);
router.put(
  "/:id",
  requireRoles("admin"),
  resourceTypeMiddleware.validateUpdateResourceType,
  resourceTypeController.updateResourceType
);
router.delete(
  "/:id",
  requireRoles("admin"),
  resourceTypeController.deleteResourceType
);

module.exports = router;
