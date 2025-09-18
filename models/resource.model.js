const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["room", "device"],
    },
    description: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],
    usageRules: { type: String },
    status: {
      type: String,
      enum: ["available", "maintenance", "unavailable"],
      default: "available",
    },
    qrcode: { type: String, default: "" },
    location: { type: String, default: "" },
    capacity: { type: Number, default: 0 },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", resourceSchema);
