import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import quetionsRoutes from './routes/questions.js';
import answerRoutes from './routes/answers.js'; // Import the Answers model
import axios from 'axios';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import Notification from './models/notification.js'; // Import the Notification model
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/questions', quetionsRoutes);
app.use('/api/answers', answerRoutes);
// summarize
app.post('/api/summarize', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    // Call Gemini API (replace YOUR_API_KEY and endpoint as needed)
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: `Summarize this to just 1/3:\n${content}` }] }]
      }
    );

    const summary = response.data.candidates[0]?.content?.parts[0]?.text || 'No summary generated.';
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//user profile
// Get user profile by Clerk ID
app.get('/:clerkUserId', async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    const user = await clerkClient.users.getUser(clerkUserId);
    
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      emailAddress: user.emailAddresses[0]?.emailAddress,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(404).json({ error: 'User not found' });
  }
});

// Notfications
// GET /api/notifications?clerkUserId=...
app.get('/api/notifications', async (req, res) => {
  const { clerkUserId } = req.query;
  if (!clerkUserId) return res.status(401).json({ error: 'Not authenticated' });
  const notifications = await Notification.find({ clerkUserId }).sort({ createdAt: -1 }).limit(50);
  
  res.json({ notifications });
});
// PATCH /api/notifications/mark-read
app.patch('/api/notifications/mark-read', async (req, res) => {
  const { clerkUserId } = req.body;
  await Notification.updateMany({ clerkUserId, read: false }, { $set: { read: true } });
  res.json({ success: true });
});




// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start server first, then connect to MongoDB
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
});

// MongoDB connection (non-blocking)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

connectDB();

export default app;