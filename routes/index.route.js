const express = require("express");
const authRoutes = require("./auth.route");
const resourceRoutes = require("./resource.route");
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/resources", resourceRoutes);

module.exports = router;
