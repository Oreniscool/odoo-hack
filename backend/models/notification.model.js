import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    message: String,
    type: { type: String, enum: ["answer", "comment", "mention"] },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Notification', notificationSchema);
