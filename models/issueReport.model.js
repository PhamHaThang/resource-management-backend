const mongoose = require("mongoose");

const issueReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
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
    description: { type: String, required: true },
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved"],
      default: "new",
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

module.exports = mongoose.model("Issue-Report", issueReportSchema);
