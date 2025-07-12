import express from 'express'; // Import default export of 'express'
const router = express.Router(); // This line remains the same

import Notification from '../models/notification.model.js'; // Import default export of your Mongoose model
import { sendNotification } from '../server.js'; // Import named export 'sendNotification' from server.js

router.get("/", (req, res) => {
  res.send("API is running...");
});

router.get("/:userId", async (req, res) => {
  const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(notifications);
});

router.put("/:userId/mark-all-read", async (req, res) => {
  await Notification.updateMany({ userId: req.params.userId }, { isRead: true });
  res.sendStatus(200);
});

router.post("/comments", async (req, res) => {
  try {
    const { type, questionId, userId, isRead, createdAt, message } = req.body;

    const newComment = await Notification.create({
      type,
      questionId,
      userId,
      isRead,
      createdAt,
      message,
    });

    sendNotification(userId, newComment);

    res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    console.error("Failed to save comment:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;