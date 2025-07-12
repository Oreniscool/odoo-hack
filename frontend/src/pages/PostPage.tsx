import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  User,
  ArrowLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  MessageSquare,
  Send,
  Edit,
  Trash2,
  CheckCircle,
  Reply,
  X,
  Save,
  AlertCircle,
  Heart,
  Star,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Helmet } from "react-helmet";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Question {
  _id: string;
  title: string;
  content: string;
  slug: string;
  author: string;
  createdAt: string;
  tags: string[];
  image?: string;
  votes?: { upvotes: number; downvotes: number };
  clerkUserId: string;
}

interface Answer {
  _id: string;
  content: string;
  author: string;
  createdAt: string;
  votes?: { upvotes: number; downvotes: number };
  accepted?: boolean;
  clerkUserId: string;
  parent?: string;
  replies?: Answer[];
}

const PostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerContent, setAnswerContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(
    new Set()
  );

  // Custom CSS variables
  const cssVars = {
    "--text": "#02110f",
    "--background": "#f9fefe",
    "--primary": "#29e2cc",
    "--secondary": "#8d7fee",
    "--accent": "#ae4ee7",
  } as React.CSSProperties;

  useEffect(() => {
    if (slug) fetchQuestion(slug);
  }, [slug]);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchQuestion = async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5001/api/questions/${slug}`);
      if (!res.ok) throw new Error("Question not found");
      const data = await res.json();
      setQuestion(data);
      fetchAnswers(data._id);
    } catch (e) {
      setError("Question not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async (questionId: string) => {
    setAnswerLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5001/api/answers/question/${questionId}`
      );
      if (!res.ok) throw new Error("Failed to fetch answers");
      const data = await res.json();

      // Build threaded structure
      const threaded = buildThreadedAnswers(data);
      setAnswers(threaded);
    } catch (e) {
      setAnswers([]);
    } finally {
      setAnswerLoading(false);
    }
  };

  const buildThreadedAnswers = (answers: Answer[]): Answer[] => {
    const answerMap = new Map<string, Answer>();
    const rootAnswers: Answer[] = [];

    // First pass: create map and initialize replies
    answers.forEach((answer) => {
      answerMap.set(answer._id, { ...answer, replies: [] });
    });

    // Second pass: build hierarchy
    answers.forEach((answer) => {
      const answerWithReplies = answerMap.get(answer._id)!;
      if (answer.parent) {
        const parent = answerMap.get(answer.parent);
        if (parent) {
          parent.replies!.push(answerWithReplies);
        }
      } else {
        rootAnswers.push(answerWithReplies);
      }
    });

    return rootAnswers;
  };

  const generateAISummary = async () => {
    if (!question) return;

    setSummaryLoading(true);
    try {
      // Mock AI summary - replace with actual AI service
      const content = `${question.content} ${answers
        .map((a) => a.content)
        .join(" ")}`;
      const summary = `This discussion covers ${
        question.title
      }. The main points include: ${content.substring(0, 200)}...`;
      setAiSummary(summary);
      setShowSummary(true);
    } catch (e) {
      showFeedback("error", "Failed to generate summary");
    } finally {
      setSummaryLoading(false);
    }
  };

  const toggleThread = (answerId: string) => {
    const newCollapsed = new Set(collapsedThreads);
    if (newCollapsed.has(answerId)) {
      newCollapsed.delete(answerId);
    } else {
      newCollapsed.add(answerId);
    }
    setCollapsedThreads(newCollapsed);
  };

  const handleVote = async (type: "up" | "down") => {
    if (!isSignedIn || !user) {
      showFeedback("error", "You must be logged in to vote.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5001/api/questions/${question?._id}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: user.id,
            vote: type === "up" ? 1 : -1,
          }),
        }
      );
      if (!res.ok) throw new Error("Vote failed");
      fetchQuestion(slug!);
      showFeedback("success", "Vote submitted!");
    } catch (e) {
      showFeedback("error", "Failed to vote.");
    }
  };

  const handleAnswerVote = async (answerId: string, type: "up" | "down") => {
    if (!isSignedIn || !user) {
      showFeedback("error", "You must be logged in to vote.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5001/api/answers/${answerId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: user.id,
            vote: type === "up" ? 1 : -1,
          }),
        }
      );
      if (!res.ok) throw new Error("Vote failed");
      fetchAnswers(question!._id);
      showFeedback("success", "Vote submitted!");
    } catch (e) {
      showFeedback("error", "Failed to vote.");
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback("error", "You must be logged in to accept answers.");
      return;
    }

    if (user.id !== question?.clerkUserId) {
      showFeedback("error", "Only the question owner can accept an answer.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5001/api/answers/${answerId}/accept`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerkUserId: user.id }),
        }
      );
      if (!res.ok) throw new Error("Accept failed");
      fetchAnswers(question!._id);
      showFeedback("success", "Answer accepted!");
    } catch (e) {
      showFeedback("error", "Failed to accept answer.");
    }
  };

  const handleReplyAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback("error", "You must be logged in to reply.");
      return;
    }

    if (!replyContent.trim()) return;

    try {
      const res = await fetch(
        `http://localhost:5001/api/answers/${answerId}/reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: replyContent,
            author:
              user.firstName || user.emailAddresses[0]?.emailAddress || "User",
            clerkUserId: user.id,
            question: question!._id,
          }),
        }
      );
      if (!res.ok) throw new Error("Reply failed");
      setReplyingTo(null);
      setReplyContent("");
      fetchAnswers(question!._id);
      showFeedback("success", "Reply submitted!");
    } catch (e) {
      showFeedback("error", "Failed to reply.");
    }
  };

  const handleEditAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback("error", "You must be logged in to edit.");
      return;
    }

    if (!editContent.trim()) return;

    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error("Edit failed");
      setEditingAnswer(null);
      setEditContent("");
      fetchAnswers(question!._id);
      showFeedback("success", "Answer updated!");
    } catch (e) {
      showFeedback("error", "Failed to edit answer.");
    }
  };

  const handleDeleteAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback("error", "You must be logged in to delete.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this answer?")) return;

    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      fetchAnswers(question!._id);
      showFeedback("success", "Answer deleted!");
    } catch (e) {
      showFeedback("error", "Failed to delete answer.");
    }
  };

  // AI Summarizer function
  const handleSummarize = async () => {
    if (!question) return;

    setSummaryLoading(true);
    try {
      // Combine question content and all answers
      const allContent = [
        `Question: ${question.title}\n\n${question.content}`,
        ...answers.map(
          (answer) => `Answer by ${answer.author}: ${answer.content}`
        ),
      ].join("\n\n");

      const res = await fetch("http://localhost:5001/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: allContent }),
      });

      if (!res.ok) throw new Error("Failed to generate summary");

      const data = await res.json();
      setSummary(data.summary);
      setShowSummary(true);
      showFeedback("success", "Summary generated successfully!");
    } catch (e) {
      showFeedback("error", "Failed to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user) {
      showFeedback("error", "You must be logged in to answer.");
      return;
    }

    if (!answerContent.trim() || !question) return;

    setAnswerLoading(true);
    try {
      const res = await fetch("http://localhost:5001/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: answerContent,
          author:
            user.firstName || user.emailAddresses[0]?.emailAddress || "User",
          question: question._id,
          clerkUserId: user.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      setAnswerContent("");
      fetchAnswers(question._id);
      showFeedback("success", "Answer submitted successfully!");
      const res2 = await fetch(
        `http://localhost:5001/api/notifications/${user.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            message: `You have an answer from ${user.firstName}`,
            type: "answer",
            questionId: question._id,
            isRead: false,
            createdAt: Date.now()
          }),
        }
      );
    } catch (e) {
      showFeedback("error", "Failed to submit answer.");
    } finally {
      setAnswerLoading(false);
    }
  };

  const renderAnswer = (answer: Answer, depth: number = 0) => {
    const isCollapsed = collapsedThreads.has(answer._id);
    const hasReplies = answer.replies && answer.replies.length > 0;

    return (
      <motion.div
        key={answer._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative ${
          depth > 0 ? "ml-8 border-l-2 border-gray-200 pl-4" : ""
        }`}
        style={cssVars}
      >
        {/* Thread line for nested replies */}
        {depth > 0 && (
          <div className="absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b from-gray-300 to-transparent"></div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-4 hover:shadow-xl transition-all duration-300">
          {/* Answer Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {answer.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  {answer.author}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(answer.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>

            {/* Collapse/Expand button for threads */}
            {hasReplies && (
              <button
                onClick={() => toggleThread(answer._id)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
                {answer.replies!.length}{" "}
                {answer.replies!.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {/* Accepted Answer Badge */}
          {answer.accepted && (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
              <CheckCircle size={16} />
              Accepted Answer
            </div>
          )}

          {/* Answer Content */}
          <div className="mb-4">
            {editingAnswer === answer._id ? (
              <div className="space-y-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 resize-none"
                  rows={6}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditAnswer(answer._id)}
                    className="bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingAnswer(null);
                      setEditContent("");
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {answer.content}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Vote and Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Vote buttons */}
              <div className="flex items-center bg-gray-50 rounded-xl p-1">
                <button
                  onClick={() => handleAnswerVote(answer._id, "up")}
                  className="p-2 hover:bg-green-100 rounded-lg transition-colors text-green-600"
                >
                  <ThumbsUp size={16} />
                </button>
                <span className="px-2 font-semibold text-gray-700">
                  {(answer.votes?.upvotes ?? 0) -
                    (answer.votes?.downvotes ?? 0)}
                </span>
                <button
                  onClick={() => handleAnswerVote(answer._id, "down")}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                >
                  <ThumbsDown size={16} />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {/* Accept Answer Button */}
              {isSignedIn &&
                user?.id === question?.clerkUserId &&
                !answer.accepted && (
                  <button
                    onClick={() => handleAcceptAnswer(answer._id)}
                    className="bg-green-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center gap-1 text-sm"
                  >
                    <CheckCircle size={14} />
                    Accept
                  </button>
                )}

              {/* Reply Button */}
              {isSignedIn && (
                <button
                  onClick={() =>
                    setReplyingTo(replyingTo === answer._id ? null : answer._id)
                  }
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm"
                >
                  <Reply size={14} />
                  Reply
                </button>
              )}

              {/* Edit Button */}
              {isSignedIn && user?.id === answer.clerkUserId && (
                <button
                  onClick={() => {
                    setEditingAnswer(answer._id);
                    setEditContent(answer.content);
                  }}
                  className="bg-yellow-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-yellow-600 transition-colors flex items-center gap-1 text-sm"
                >
                  <Edit size={14} />
                  Edit
                </button>
              )}

              {/* Delete Button */}
              {isSignedIn && user?.id === answer.clerkUserId && (
                <button
                  onClick={() => handleDeleteAnswer(answer._id)}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-1 text-sm"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Reply Form */}
          {replyingTo === answer._id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-gray-50 rounded-xl"
            >
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleReplyAnswer(answer._id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Send size={16} />
                  Reply
                </button>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent("");
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Render Replies */}
        <AnimatePresence>
          {hasReplies && !isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {answer.replies!.map((reply) => renderAnswer(reply, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const getTagColor = (tag: string) => {
    const colors = [
      "bg-gradient-to-r from-purple-400 to-pink-400",
      "bg-gradient-to-r from-blue-400 to-cyan-400",
      "bg-gradient-to-r from-green-400 to-emerald-400",
      "bg-gradient-to-r from-orange-400 to-red-400",
      "bg-gradient-to-r from-indigo-400 to-purple-400",
      "bg-gradient-to-r from-pink-400 to-rose-400",
    ];
    return colors[tag.length % colors.length];
  };

  if (loading)
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={cssVars}
      >
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-xl font-semibold text-gray-700">
            Loading question...
          </p>
        </div>
      </div>
    );

  if (error || !question)
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        style={cssVars}
      >
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {error || "Question not found"}
          </h2>
          <Link
            to="/"
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50" style={cssVars}>
      <Helmet>
        <title>{question.title} | StackIt</title>
      </Helmet>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
              feedback.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Questions
          </Link>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-start gap-6">
              {/* Vote Section */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => handleVote("up")}
                  className="p-3 bg-green-100 hover:bg-green-200 rounded-xl transition-colors text-green-600"
                >
                  <ThumbsUp size={24} />
                </button>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {(question.votes?.upvotes ?? 0) -
                      (question.votes?.downvotes ?? 0)}
                  </div>
                  <div className="text-sm text-gray-500">votes</div>
                </div>
                <button
                  onClick={() => handleVote("down")}
                  className="p-3 bg-red-100 hover:bg-red-200 rounded-xl transition-colors text-red-600"
                >
                  <ThumbsDown size={24} />
                </button>
              </div>

              {/* Question Content */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {question.title}
                </h1>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {question.tags.map((tag, i) => (
                    <span
                      key={i}
                      className={`${getTagColor(
                        tag
                      )} text-white px-3 py-1 rounded-full text-sm font-medium`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Question Image */}
                {question.image && (
                  <img
                    src={question.image}
                    alt="Question"
                    className="w-full max-w-md rounded-xl shadow-md mb-4"
                  />
                )}

                {/* Question Body */}
                <div className="prose prose-lg max-w-none mb-6">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {question.content}
                  </ReactMarkdown>
                </div>

                {/* Question Meta */}
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span className="font-medium">{question.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>
                      {new Date(question.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Section */}
      {showSummary && summary && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl shadow-xl p-8 mb-8 border-2 border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold text-gray-800">AI Summary</h2>
            <button
              onClick={() => setShowSummary(false)}
              className="ml-auto bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-2xl p-6 shadow-inner">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Answers Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800">
            {answers.length} Answer{answers.length !== 1 ? "s" : ""}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSummarize}
              disabled={summaryLoading || !question}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {summaryLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {summaryLoading ? "Generating..." : "AI Summary"}
            </button>
            {isSignedIn && (
              <button
                onClick={() =>
                  document
                    .getElementById("answer-form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Write Answer
              </button>
            )}
          </div>
        </div>

        {answerLoading ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto mb-4" size={48} />
            <p className="text-xl font-semibold text-gray-700">
              Loading answers...
            </p>
          </div>
        ) : answers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
            <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No answers yet
            </h3>
            <p className="text-gray-500 mb-6">
              Be the first to answer this question!
            </p>
            {isSignedIn && (
              <button
                onClick={() =>
                  document
                    .getElementById("answer-form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Write First Answer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer) => renderAnswer(answer))}
          </div>
        )}
      </div>

      {/* Answer Form */}
      {isSignedIn && (
        <div
          id="answer-form"
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Write Your Answer
          </h3>
          <form onSubmit={handleSubmitAnswer} className="space-y-6">
            <textarea
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              placeholder="Share your knowledge and help others..."
              className="w-full p-6 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-400 resize-none text-lg"
              rows={8}
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={answerLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {answerLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Send size={20} />
                )}
                {answerLoading ? "Posting..." : "Post Answer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sign In Prompt */}
      {!isSignedIn && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
          <User className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Want to answer this question?
          </h3>
          <p className="text-gray-500 mb-6">
            Join our community to share your knowledge and help others.
          </p>
          <button
            onClick={() => navigate("/sign-in")}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Sign In to Answer
          </button>
        </div>
      )}
    </div>
  );
};

export default PostPage;
