const express = require("express");
const router = express.Router();
const resourceTypeController = require("../controllers/resourceType.controller");
const { authenticateJWT, requireRoles } = require("../middlewares/auth");

router.post(
  "/",
  authenticateJWT,
  requireRoles("admin"),
  resourceTypeController.createResourceType
);
router.get("/", resourceTypeController.getAllResourceTypes);
router.put(
  "/:id",
  authenticateJWT,
  requireRoles("admin"),
  resourceTypeController.updateResourceType
);
router.delete(
  "/:id",
  authenticateJWT,
  requireRoles("admin"),
  resourceTypeController.deleteResourceType
);

module.exports = router;
