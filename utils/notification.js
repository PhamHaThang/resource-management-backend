const Notification = require("../models/notification.model");
async function createNotificationForUser(
  userId,
  title,
  content,
  relatedType,
  relatedId
) {
  try {
    const notif = new Notification({
      userId,
      title,
      content,
      relatedType,
      relatedId,
    });
    await notif.save();
    console.log("Notification created for user:", userId.toString());
  } catch (error) {
    console.error("Create notification failed:", error.message);
  }
}
module.exports = { createNotificationForUser };
