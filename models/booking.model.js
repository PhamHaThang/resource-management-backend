const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    purpose: { type: String, default: "" },
    check_in_at: { type: Date },
    check_out_at: { type: Date },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    rejectReason: { type: String, default: "" },
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

module.exports = mongoose.model("Booking", bookingSchema);
