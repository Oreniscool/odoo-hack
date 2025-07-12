// === server.js ===
import express from "express"; // Change to ES Module import
import http from "http";     // Change to ES Module import
import cors from "cors";     // Change to ES Module import
import { Server } from "socket.io"; // Change to ES Module import

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  },
});

app.use(cors());
app.use(express.json());

const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register", (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`Registered user ${userId}`);
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log("Socket disconnected:", socket.id);
  });
});

// Send notification to a specific user
const sendNotification = (userId, notification) => {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit("notification", notification);
    console.log(`Sent notification to ${userId}`);
  } else {
    console.log(`User ${userId} not connected or registered.`);
    // TODO: Implement persistent notifications (e.g., save to DB) for offline users
  }
};

// Broadcast answer to all users
const sendAnswer = (answer) => {
  io.emit("answer", answer);
  console.log("Broadcasted new answer to all users");
};

// This line is fine for ES Modules if you want to export an object
// containing everything as a default export.
// However, since you're using named imports in other files:
// import { sendNotification, sendAnswer } from '../server.js';
// you should use named exports here.

// Change this to named exports
export { app, server, sendNotification, sendAnswer, io, connectedUsers }; // Added io and connectedUsers if you need to access them elsewhere