import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import quetionsRoutes from './routes/questions.js';
import answerRoutes from './routes/answers.js'; // Import the Answers model
import notificationRoutes from './routes/notification.route.js'
import axios from 'axios';
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
app.use("/api/notifications", notificationRoutes);
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