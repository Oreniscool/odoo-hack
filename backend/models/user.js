// models/user.js (or whatever path you prefer, e.g., ../models/user.js)
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensures usernames are unique for @mentions
    trim: true,   // Removes whitespace from both ends of a string
    lowercase: true, // Stores usernames in lowercase for consistent lookups
    minlength: 3,
    maxlength: 30,
    match: /^[a-z0-9_.]+$/, // Allows only lowercase letters, numbers, underscores, and periods
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^\S+@\S+\.\S+$/, // Basic email regex
  },
  clerkUserId: {
    type: String,
    required: true,
    unique: true, // Crucial for mapping Socket.IO connections to Clerk users
    index: true, // Index for faster lookups when sending notifications
  },
  // You can add more fields here as needed, for example:
  fullName: {
    type: String,
    trim: true,
  },
  profilePicture: {
    type: String, // URL to a profile picture
  },
  bio: {
    type: String,
    maxlength: 500,
  },
//   Add roles if you have admin/moderator functionality
  roles: [{
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
  }],
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

const User = mongoose.model('User', userSchema);

export default User;