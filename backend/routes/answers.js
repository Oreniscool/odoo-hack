import express from 'express';
import Answers from '../models/answerSchema.js'; // Your AnswerSchema model
import Questions from '../models/schema.js';     // Your QuestionSchema model

const router = express.Router();


// POST /answers
router.post('/', async (req, res) => {
  try {
    const { content, author, clerkUserId, question } = req.body;
    const answer = new Answers({ content, author, clerkUserId, question });
    await answer.save();
    res.status(201).json(answer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /answers/question/:questionId
router.get('/question/:questionId', async (req, res) => {
  try {
    const answers = await Answers.find({ question: req.params.questionId });
    res.json(answers);
  } catch (err) {
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
    res.json(answer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /answers/:id
router.delete('/:id', async (req, res) => {
  try {
    const answer = await Answers.findByIdAndDelete(req.params.id);
    if (!answer) return res.status(404).json({ error: 'Answer not found' });
    res.json({ message: 'Answer deleted' });
  } catch (err) {
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
      // Update vote
      if (existingVote.vote === 1) answer.votes.upvotes--;
      if (existingVote.vote === -1) answer.votes.downvotes--;
      existingVote.vote = vote;
    } else {
      answer.voters.push({ clerkUserId, vote });
    }
    if (vote === 1) answer.votes.upvotes++;
    if (vote === -1) answer.votes.downvotes++;

    await answer.save();
    res.json(answer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;