import express from 'express';
import slugify from 'slugify';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import Questions from '../models/schema.js';
import multer from 'multer';

// Import the notification functions from server.js
import { sendNotification, sendAnswer } from '../server.js'; // Adjust path as needed

const router = express.Router();

// Create DOM purify instance
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Helper function to generate unique slug
const generateUniqueSlug = async (title, excludeId = null) => {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = excludeId
      ? { slug, _id: { $ne: excludeId } }
      : { slug };

    const existingQuestion = await Questions.findOne(query);
    if (!existingQuestion) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// Helper function to calculate read time
const calculateReadTime = (content) => {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

// Helper function to generate excerpt
const generateExcerpt = (content, maxLength = 150) => {
  const textContent = content.replace(/<[^>]*>/g, '');
  return textContent.length > maxLength
    ? textContent.substring(0, maxLength) + '...'
    : textContent;
};

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting logic
    let sortQuery = { createdAt: -1 }; // default is newest first
    if (req.query.sortBy === 'latest') {
      sortQuery = { createdAt: -1 }; // same as default, just for clarity
    } else if (req.query.sortBy === 'oldest') {
      sortQuery = { createdAt: 1 }; // oldest first
    }

    const [posts, total] = await Promise.all([
      Questions.find({ published: true })
        .sort(sortQuery)
        .skip(skip)
        .limit(limit),
      Questions.countDocuments({ published: true })
    ]);

    const postsWithImages = posts.map(post => {
      let image = null;
      if (post.image?.data && post.image?.contentType) {
        const base64 = post.image.data.toString('base64');
        image = `data:${post.image.contentType};base64,${base64}`;
      }
      return {
        _id: post._id,
        title: post.title,
        excerpt: post.excerpt,
        slug: post.slug,
        author: post.author,
        createdAt: post.createdAt,
        readTime: post.readTime,
        tags: post.tags,
        image,
      };
    });

    res.json({
      posts: postsWithImages,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error); // Added console.error
    res.status(500).json({ error: error.message });
  }
});


//returns all posts excluding content
// GET /api/posts/admin - Get all posts for admin (including drafts)
router.get('/admin', async (req, res) => {
  try {
    const posts = await Questions.find()
      .sort({ createdAt: -1 })
      .select('-content');

    res.json(posts);
  } catch (error) {
    console.error('Error fetching admin questions:', error); // Added console.error
    res.status(500).json({ error: error.message });
  }
});


router.post('/user', async (req, res) => {
  const { clerkUserId } = req.body;

  if (!clerkUserId || typeof clerkUserId !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing clerkUserId' });
  }

  try {
    const posts = await Questions.find({ clerkUserId });
    res.json({ posts }); // send wrapped in object for clarity
  } catch (err) {
    console.error('Error fetching user questions:', err); // Corrected console.error
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/:slug', async (req, res) => {
  try {
    const post = await Questions.findOne({
      slug: req.params.slug,
      published: true
    });

    if (!post) {
      return res.status(404).json({ error: 'Questions not found' });
    }

    const postWithImage = {
      ...post.toObject(),
      image: post.image?.data
        ? `data:${post.image.contentType};base64,${post.image.data.toString('base64')}`
        : null
    };

    res.json(postWithImage);
  } catch (error) {
    console.error('Error fetching single question by slug:', error); // Added console.error
    res.status(500).json({ error: error.message });
  }
});


// Setup multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      content,
      author,
      published = true,
      tags = '[]',
      clerkUserId,
    } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({
        error: 'Title, content, and author are required'
      });
    }

    // Sanitize HTML content to remove scripts
    const sanitizedContent = purify.sanitize(content);

    // Generate slug, excerpt, and read time
    const slug = await generateUniqueSlug(title);
    const readTime = calculateReadTime(sanitizedContent);
    const excerpt = generateExcerpt(sanitizedContent);

    const post = new Questions({
      title: title.trim(),
      content: sanitizedContent,
      slug,
      excerpt,
      author: author.trim(),
      published: published === 'true' || published === true,
      tags: JSON.parse(tags).map(tag => tag.trim()),
      readTime,
      clerkUserId,
      image: req.file ? {
        data: req.file.buffer,
        contentType: req.file.mimetype
      } : undefined,
      votes: { upvotes: 0, downvotes: 0 }, // Optional, schema default handles this
      voters: [] // Optional, schema default handles this
    });

    await post.save();

    // --- Real-time notification: New question created ---
    // Broadcast to all connected users about a new question
    const newQuestionNotification = {
      type: 'new_question',
      message: `A new question titled "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}" has been posted by ${post.author}.`,
      questionId: post._id,
      slug: post.slug,
      author: post.author
    };
    sendAnswer(newQuestionNotification); // Using sendAnswer as a general broadcast
    console.log(`Broadcasted new question event for ${post._id}.`);


    res.status(201).json(post);
  } catch (error) {
    console.error('[Create Questions Error]', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

//if title is changed then it will generate a new slug
// if content is changed then it will sanitize the content
// if tags are changed then it will update the tags
// if published is changed then it will update the published status
// if readTime is changed then it will update the read time
// if excerpt is changed then it will update the excerpt
// if author is changed then it will update the author
// PUT /api/posts/:slug - Update post
router.put('/:slug', async (req, res) => {
  try {
    const { title, content, published, tags = [], clerkUserId } = req.body; // clerkUserId used for notification sender check

    const post = await Questions.findOne({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({ error: 'Questions not found' });
    }

    // Sanitize content if provided
    const sanitizedContent = content ? purify.sanitize(content) : post.content;

    // Generate new slug if title changed
    let newSlug = post.slug;
    if (title && title !== post.title) {
      newSlug = await generateUniqueSlug(title, post._id);
    }

    // Update fields
    const oldTitle = post.title; // Store old title for notification message
    post.title = title || post.title;
    post.content = sanitizedContent;
    post.slug = newSlug;
    post.published = published !== undefined ? published : post.published;
    post.tags = tags.map(tag => tag.trim()).filter(Boolean);
    post.readTime = calculateReadTime(sanitizedContent);
    post.excerpt = generateExcerpt(sanitizedContent);

    await post.save();

    // --- Real-time notification: Question updated ---
    // Notify the author of the question about the update
    // Only if the update was performed by someone other than the author (or if you want self-notifications for updates)
    // Here, I'm assuming the 'clerkUserId' in req.body is the updater's ID.
    // If you want to notify only if someone *else* updates, you'd add: `if (post.clerkUserId && clerkUserId !== post.clerkUserId)`
    if (post.clerkUserId) {
      const updateNotification = {
        type: 'question_updated',
        message: `Your question titled "${oldTitle.substring(0, 50)}${oldTitle.length > 50 ? '...' : ''}" has been updated.`,
        questionId: post._id,
        slug: post.slug
      };
      sendNotification(post.clerkUserId, updateNotification);
      console.log(`Notification sent to question author ${post.clerkUserId} for update.`);
    }

    res.json(post);
  } catch (error) {
    if (error.code === 11000) {
      console.error('Error updating question (slug conflict):', error); // Added console.error
      res.status(400).json({ error: 'A post with this slug already exists' });
    } else {
      console.error('Error updating question:', error); // Added console.error
      res.status(500).json({ error: error.message });
    }
  }
});


//just deletes the post
// DELETE /api/posts/:slug - Delete post
router.delete('/:slug', async (req, res) => {
  try {
    const post = await Questions.findOneAndDelete({ slug: req.params.slug });

    if (!post) {
      return res.status(404).json({ error: 'Questions not found' });
    }

    // --- Real-time notification: Question deleted ---
    // You might want to notify an admin or the author if they are still active
    const deleteNotification = {
      type: 'question_deleted',
      message: `The question titled "${post.title.substring(0, 50)}${post.title.length > 50 ? '...' : ''}" has been deleted.`,
      questionId: post._id
    };
    // Example: Notify a specific admin user if they were tracking it, or broadcast
    // sendNotification('adminUserId', deleteNotification); // To a specific admin
    sendAnswer(deleteNotification); // Broadcasting deletion to all connected users
    console.log(`Broadcasted question deletion event for ${post._id}.`);

    res.json({ message: 'Questions deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error); // Added console.error
    res.status(500).json({ error: error.message });
  }
});


// POST /questions/:id/vote
router.post('/:id/vote', async (req, res) => {
  try {
    const { clerkUserId, vote } = req.body; // vote: 1 for upvote, -1 for downvote
    const question = await Questions.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const existingVote = question.voters.find(v => v.clerkUserId === clerkUserId);
    if (existingVote) {
      if (existingVote.vote === vote) {
        return res.status(400).json({ error: 'Already voted' });
      }
      // Update vote: decrement old vote type, increment new vote type
      if (existingVote.vote === 1) question.votes.upvotes--;
      if (existingVote.vote === -1) question.votes.downvotes--;
      existingVote.vote = vote;
    } else {
      question.voters.push({ clerkUserId, vote });
    }
    // Increment new vote type
    if (vote === 1) question.votes.upvotes++;
    if (vote === -1) question.votes.downvotes++;

    await question.save();

    // --- Real-time notification: Vote received on a question ---
    // Notify the author of the question about the new vote
    // Only notify if the voter is not the question's author
    if (question.clerkUserId && clerkUserId !== question.clerkUserId) {
      const voteType = vote === 1 ? 'upvote' : 'downvote';
      sendNotification(question.clerkUserId, {
        type: 'question_vote_received',
        message: `Your question "${question.title.substring(0, 50)}${question.title.length > 50 ? '...' : ''}" received a new ${voteType}!`,
        questionId: question._id,
        slug: question.slug,
        voterId: clerkUserId
      });
      console.log(`Notification sent to question author ${question.clerkUserId} for vote.`);
    }

    res.json(question);
  } catch (err) {
    console.error('Error voting on question:', err); // Added console.error
    res.status(400).json({ error: err.message });
  }
});


export default router;