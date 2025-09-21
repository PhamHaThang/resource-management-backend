const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String },
    isRead: { type: Boolean, default: false },
    relatedType: { type: String },
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    createdAt: { type: Date, default: Date.now },
  },
  {
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

module.exports = mongoose.model("Notification", NotificationSchema);
