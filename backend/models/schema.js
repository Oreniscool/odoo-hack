import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  author: {
    type: String,
    required: true
  },
  published: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  readTime: {
    type: Number,
    default: 1
  },clerkUserId: {
    type: String,
    required: true
  },
  image: {
    data: Buffer,
    contentType: String
  }
}, {
  timestamps: true
});

// const BlogSchema = new mongoose.Schema({
//   clerkUserId: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   posts : [PostSchema]
//   })

// Index for better query performance
QuestionSchema.index({ slug: 1 });
QuestionSchema.index({ published: 1, createdAt: -1 });

export default mongoose.model('Questions', QuestionSchema);