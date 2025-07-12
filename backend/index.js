// === index.js ===
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http'; // <--- NEW: Import http module
import { Server } from 'socket.io'; // <--- NEW: Import Server from socket.io

import quetionsRoutes from './routes/questions.js';
import answerRoutes from './routes/answers.js';
import notificationRoutes from './routes/notification.route.js';

// If you have a separate file for Socket.IO logic, import it here
// e.g., import { io, sendNotification, sendAnswer, connectedUsers } from './socketManager.js';
// For now, we'll assume you'll integrate the socket.io setup directly into this file
// or modify socketManager.js to take the 'server' instance.


import axios from 'axios';
dotenv.config();

const app = express();
const server = http.createServer(app); // <--- CRITICAL CHANGE: Create an HTTP server
const io = new Server(server, { // <--- CRITICAL CHANGE: Attach Socket.IO to the HTTP server
  cors: {
    origin: "*", // Keep for dev, but tighten for production to your frontend URL (e.g., http://localhost:3000)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  },
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// -----------------------------------------------------------
// Socket.IO Connection Logic (integrate here or in a manager file)
// This is the essential part that was missing from your main server setup.
// If you have this logic in 'server.js' as you showed before, you'll need
// to adapt it to receive 'io' (and 'server') from here.

const connectedUsers = new Map(); // Keep this map in scope where 'io' is accessible

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register", (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`Registered user ${userId} with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    let disconnectedUserId;
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    if (disconnectedUserId) {
      connectedUsers.delete(disconnectedUserId);
      console.log(`Unregistered user ${disconnectedUserId} due to socket disconnection.`);
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// Helper functions for sending notifications via Socket.IO
// These can be exported from a socketManager.js and accept 'io' as an argument
// or directly use the 'io' instance from this file if defined here.
export const sendNotification = (userId, notification) => { // Export for use in other routes
    const socketId = connectedUsers.get(userId);
    if (socketId) {
        io.to(socketId).emit("notification", notification);
        console.log(`Sent notification to ${userId}`);
    } else {
        console.log(`User ${userId} not connected or registered (offline).`);
        // TODO: Save notification to DB for offline users
    }
};

export const sendAnswer = (answer) => { // Export for use in other routes
    io.emit("answer", answer);
    console.log("Broadcasted new answer to all users");
};

// -----------------------------------------------------------

// Routes (using app)
app.use("/api/notifications", notificationRoutes);
app.use('/api/questions', quetionsRoutes);
app.use('/api/answers', answerRoutes);

// Summarize endpoint (Express route)
app.post('/api/summarize', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: `Summarize this to just 1/3:\n${content}` }] }]
      }
    );

    const summary = response.data.candidates[0]?.content?.parts[0]?.text || 'No summary generated.';
    res.json({ summary });
  } catch (err) {
    console.error("Summarize API error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Health check (Express route)
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});


// Start the HTTP server (which Express and Socket.IO are attached to)
server.listen(PORT, () => { // <--- CRITICAL CHANGE: Listen on the 'server' instance
  console.log(`Server running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
  console.log(`Socket.IO is listening on ws://localhost:${PORT}`);
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
