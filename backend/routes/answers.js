import express from 'express';
import Answers from '../models/answer.js';     // Your AnswerSchema model
import Questions from '../models/schema.js';     // Your QuestionSchema model
import Users from '../models/user.js';         // Your User model for @mentions
import { sendNotification, sendAnswer } from '../server.js'; // Import notification functions

const router = express.Router();

// Utility: extract mentioned usernames from content like "@username"
const extractMentions = (text) => {
  const mentions = text.match(/@[\w.-]+/g); // Regex to find @ followed by word characters, periods, or hyphens
  return mentions ? mentions.map(m => m.slice(1)) : []; // Remove the '@'
};

// POST /answers - When someone answers a question
router.post('/', async (req, res) => {
  try {
    const { content, author, clerkUserId, question, parent = null } = req.body;
    const answer = new Answers({ content, author, clerkUserId, question, parent });
    await answer.save();

    // 1. Notify question owner if someone else answers their question
    const q = await Questions.findById(question);
    if (q && q.clerkUserId && q.clerkUserId !== clerkUserId) { // Ensure question owner is not the one answering
      sendNotification(q.clerkUserId, {
        type: 'answer_to_your_question',
        message: `${author} answered your question: "${q.title.substring(0, 50)}${q.title.length > 50 ? '...' : ''}"`,
        questionId: question,
        answerId: answer._id,
        // Optional: Include slug if you want to create a direct link
        // slug: q.slug
      });
      console.log(`Notification sent to question owner ${q.clerkUserId} for new answer.`);
    }

    // 2. Handle @mentions in content (for a new answer)
    const mentionedUsernames = extractMentions(content);
    // Find users by their username and get their clerkUserId
    const mentionedUsers = await Users.find({ username: { $in: mentionedUsernames } }).select('clerkUserId username');

    for (const mentionedUser of mentionedUsers) {
      if (mentionedUser.clerkUserId && mentionedUser.clerkUserId !== clerkUserId) { // Don't notify if user mentions themselves
        sendNotification(mentionedUser.clerkUserId, {
          type: 'mention_in_answer',
          message: `${author} mentioned you in an answer to ${q ? `"${q.title.substring(0, 50)}${q.title.length > 50 ? '...' : ''}"` : 'a question'}.`,
          questionId: question,
          answerId: answer._id
        });
        console.log(`Notification sent to mentioned user ${mentionedUser.clerkUserId}.`);
      }
    }

    res.status(201).json(answer);
  } catch (err) {
    console.error('Error creating answer and sending notifications:', err);
    res.status(400).json({ error: err.message });
  }
});


// GET /answers/question/:questionId
router.get('/question/:questionId', async (req, res) => {
  try {
    const answers = await Answers.find({ question: req.params.questionId });
    res.json(answers);
  } catch (err) {
    console.error('Error fetching answers by question ID:', err);
    res.status(500).json({ error: err.message });
  }
});


// GET /answers/:id
router.get('/:id', async (req, res) => {
  try {
    const answer = await Answers.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    res.json(answer);
  } catch (err) {
    console.error('Error fetching answer by ID:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /answers/:id
router.put('/:id', async (req, res) => {
  try {
    const answer = await Answers.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    // Optional: Notify author of answer if their answer was updated by someone else
    // (This scenario is less common for notifications unless it's an admin edit)
    // For now, I'm skipping explicit notification for a general 'PUT' on an answer
    // as it's typically used by the answer's author.

    res.json(answer);
  } catch (err) {
    console.error('Error updating answer:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /answers/:id/reply - When someone comments on an answer
router.post('/:id/reply', async (req, res) => {
  try {
    const { content, author, clerkUserId, question } = req.body;
    const parent = req.params.id; // This is the parent answer's ID

    const parentAnswer = await Answers.findById(parent);
    if (!parentAnswer) {
      return res.status(404).json({ error: 'Parent answer not found' });
    }

    const reply = new Answers({ content, author, clerkUserId, question, parent });
    await reply.save();

    // 1. Notify parent answer owner if someone comments on their answer
    if (parentAnswer.clerkUserId && parentAnswer.clerkUserId !== clerkUserId) { // Ensure parent answer owner is not the one replying
      // Fetch the question title for a more informative notification
      const q = await Questions.findById(question);
      const questionTitle = q ? q.title.substring(0, 50) + (q.title.length > 50 ? '...' : '') : 'a question';

      sendNotification(parentAnswer.clerkUserId, {
        type: 'comment_on_your_answer',
        message: `${author} commented on your answer to "${questionTitle}"`,
        questionId: question,
        parentAnswerId: parentAnswer._id,
        replyId: reply._id
      });
      console.log(`Notification sent to parent answer owner ${parentAnswer.clerkUserId} for new comment.`);
    }

    // 2. Handle @mentions in replies/comments
    const mentionedUsernames = extractMentions(content);
    const mentionedUsers = await Users.find({ username: { $in: mentionedUsernames } }).select('clerkUserId username');

    for (const mentionedUser of mentionedUsers) {
      if (mentionedUser.clerkUserId && mentionedUser.clerkUserId !== clerkUserId) { // Don't notify if user mentions themselves
        const q = await Questions.findById(question);
        const questionTitle = q ? q.title.substring(0, 50) + (q.title.length > 50 ? '...' : '') : 'a question';

        sendNotification(mentionedUser.clerkUserId, {
          type: 'mention_in_comment',
          message: `${author} mentioned you in a comment on an answer to "${questionTitle}"`,
          questionId: question,
          answerId: reply._id // This is the ID of the reply (comment)
        });
        console.log(`Notification sent to mentioned user ${mentionedUser.clerkUserId}.`);
      }
    }

    res.status(201).json(reply);

  } catch (err) {
    console.error('Error creating reply and sending notifications:', err);
    res.status(400).json({ error: err.message });
  }
});


// DELETE /answers/:id
router.delete('/:id', async (req, res) => {
  try {
    const answer = await Answers.findByIdAndDelete(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    // Optional: You might want to notify the question owner or the answer author
    // if the answer was deleted by someone else (e.g., moderator).
    // For simplicity, not adding specific notification here by default.

    res.json({ message: 'Answer deleted' });
  } catch (err) {
    console.error('Error deleting answer:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /answers/:id/vote
router.post('/:id/vote', async (req, res) => {
  try {
    const { clerkUserId, vote } = req.body; // vote: 1 for upvote, -1 for downvote
    const answer = await Answers.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    const existingVote = answer.voters.find(v => v.clerkUserId === clerkUserId);
    if (existingVote) {
      // Prevent duplicate voting or update the vote
      if (existingVote.vote === vote) {
        return res.status(400).json({ error: 'Already voted' });
      }
      // Update vote: decrement old vote type, increment new vote type
      if (existingVote.vote === 1) answer.votes.upvotes--;
      if (existingVote.vote === -1) answer.votes.downvotes--;
      existingVote.vote = vote;
    } else {
      answer.voters.push({ clerkUserId, vote });
    }
    // Increment new vote type
    if (vote === 1) answer.votes.upvotes++;
    if (vote === -1) answer.votes.downvotes++;

    await answer.save();

    // Notify the author of the answer about the new vote
    // Only notify if the voter is not the answer's author
    if (answer.clerkUserId && clerkUserId !== answer.clerkUserId) {
      const voteType = vote === 1 ? 'upvote' : 'downvote';
      sendNotification(answer.clerkUserId, {
        type: 'answer_vote_received',
        message: `Your answer received a new ${voteType}!`,
        answerId: answer._id,
        questionId: answer.question, // Include questionId for context
        voterId: clerkUserId
      });
      console.log(`Notification sent to answer author ${answer.clerkUserId} for vote.`);
    }

    res.json(answer);
  } catch (err) {
    console.error('Error voting on answer:', err);
    res.status(400).json({ error: err.message });
  }
});


// PATCH /answers/:id/accept
router.patch('/:id/accept', async (req, res) => {
  try {
    const answerId = req.params.id;
    const userClerkId = req.body.clerkUserId; // Or get from auth middleware/session

    const answer = await Answers.findById(answerId);
    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    const question = await Questions.findById(answer.question);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Only the question owner can accept an answer
    if (question.clerkUserId !== userClerkId) {
      return res.status(403).json({ error: 'Only the question owner can accept an answer.' });
    }

    // Optionally, unaccept any previously accepted answer for this question
    // This ensures only one accepted answer per question
    await Answers.updateMany(
      { question: question._id, accepted: true },
      { $set: { accepted: false } }
    );

    // Set this answer as accepted
    answer.accepted = true;
    await answer.save();

    // Notify the author of the accepted answer
    if (answer.clerkUserId && answer.clerkUserId !== userClerkId) { // Don't notify if question owner accepts their own answer (unlikely)
      sendNotification(answer.clerkUserId, {
        type: 'answer_accepted',
        message: `Your answer to "${question.title.substring(0, 50)}${question.title.length > 50 ? '...' : ''}" was accepted!`,
        questionId: question._id,
        answerId: answer._id
      });
      console.log(`Notification sent to answer author ${answer.clerkUserId} for acceptance.`);
    }

    res.json({ message: 'Answer marked as accepted', answer });
  } catch (err) {
    console.error('Error accepting answer and sending notifications:', err);
    res.status(500).json({ error: err.message });
  }
});


// GET /answers/thread/:parentId - Get a specific answer and its direct replies
router.get('/thread/:parentId', async (req, res) => {
  try {
    const parentId = req.params.parentId;

    const parentAnswer = await Answers.findById(parentId);
    if (!parentAnswer) {
      return res.status(404).json({ error: 'Parent answer not found' });
    }

    // Find all replies to this specific parent answer
    const replies = await Answers.find({ parent: parentId }).lean();

    // You can recursively build a deeper thread structure if needed
    // For now, this just gets the parent and its direct replies
    const thread = { ...parentAnswer.toObject(), replies: replies };

    res.json(thread);
  } catch (err) {
    console.error('Error fetching answer thread:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;