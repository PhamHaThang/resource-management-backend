const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResourceType",
      required: true,
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
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        Object.keys(ret).forEach((key) => {
          if (ret[key] == null || ret[key] === "") {
            delete ret[key];
          }
        });
        return ret;
      },
    },
  }
);

module.exports = mongoose.model("Resource", resourceSchema);
