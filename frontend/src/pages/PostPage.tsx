import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, User, ArrowLeft, ChevronRight, ThumbsUp, ThumbsDown, 
  Loader2, MessageSquare, Send, Edit, Trash2, CheckCircle, 
  Reply, X, Save, AlertCircle, Heart, Star
} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useUser } from '@clerk/clerk-react';

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
  const [answerContent, setAnswerContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    if (slug) fetchQuestion(slug);
  }, [slug]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchQuestion = async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5001/api/questions/${slug}`);
      if (!res.ok) throw new Error('Question not found');
      const data = await res.json();
      setQuestion(data);
      fetchAnswers(data._id);
    } catch (e) {
      setError('Question not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async (questionId: string) => {
    setAnswerLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/answers/question/${questionId}`);
      if (!res.ok) throw new Error('Failed to fetch answers');
      const data = await res.json();
      setAnswers(data);
    } catch (e) {
      setAnswers([]);
    } finally {
      setAnswerLoading(false);
    }
  };

  // Voting for question
  const handleVote = async (type: 'up' | 'down') => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to vote.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5001/api/questions/${question?._id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          vote: type === 'up' ? 1 : -1,
        }),
      });
      if (!res.ok) throw new Error('Vote failed');
      fetchQuestion(slug!);
      showFeedback('success', 'Vote submitted!');
    } catch (e) {
      showFeedback('error', 'Failed to vote.');
    }
  };

  // Voting for answer
  const handleAnswerVote = async (answerId: string, type: 'up' | 'down') => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to vote.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          vote: type === 'up' ? 1 : -1,
        }),
      });
      if (!res.ok) throw new Error('Vote failed');
      fetchAnswers(question!._id);
      showFeedback('success', 'Vote submitted!');
    } catch (e) {
      showFeedback('error', 'Failed to vote.');
    }
  };

  // Accept answer
  const handleAcceptAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to accept answers.');
      return;
    }
    if (user.id !== question?.clerkUserId) {
      showFeedback('error', 'Only the question owner can accept an answer.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: user.id }),
      });
      if (!res.ok) throw new Error('Accept failed');
      fetchAnswers(question!._id);
      showFeedback('success', 'Answer accepted!');
    } catch (e) {
      showFeedback('error', 'Failed to accept answer.');
    }
  };

  // Reply to answer
  const handleReplyAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to reply.');
      return;
    }
    if (!replyContent.trim()) return;
    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          author: user.firstName || user.emailAddresses[0]?.emailAddress || 'User',
          clerkUserId: user.id,
          question: question!._id,
        }),
      });
      if (!res.ok) throw new Error('Reply failed');
      setReplyingTo(null);
      setReplyContent('');
      fetchAnswers(question!._id);
      showFeedback('success', 'Reply submitted!');
    } catch (e) {
      showFeedback('error', 'Failed to reply.');
    }
  };

  // Edit answer
  const handleEditAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to edit.');
      return;
    }
    if (!editContent.trim()) return;
    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (!res.ok) throw new Error('Edit failed');
      setEditingAnswer(null);
      setEditContent('');
      fetchAnswers(question!._id);
      showFeedback('success', 'Answer updated!');
    } catch (e) {
      showFeedback('error', 'Failed to edit answer.');
    }
  };

  // Delete answer
  const handleDeleteAnswer = async (answerId: string) => {
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to delete.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this answer?')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/answers/${answerId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchAnswers(question!._id);
      showFeedback('success', 'Answer deleted!');
    } catch (e) {
      showFeedback('error', 'Failed to delete answer.');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !user) {
      showFeedback('error', 'You must be logged in to answer.');
      return;
    }
    if (!answerContent.trim() || !question) return;
    
    setAnswerLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: answerContent,
          author: user.firstName || user.emailAddresses[0]?.emailAddress || 'User',
          question: question._id,
          clerkUserId: user.id,
        }),
      });
      if (!res.ok) throw new Error('Failed to submit answer');
      setAnswerContent('');
      fetchAnswers(question._id);
      showFeedback('success', 'Answer submitted successfully!');
    } catch (e) {
      showFeedback('error', 'Failed to submit answer.');
    } finally {
      setAnswerLoading(false);
    }
  };

  const getTagColor = (tag: string) => {
    const colors = [
      'bg-gradient-to-r from-purple-400 to-pink-400',
      'bg-gradient-to-r from-blue-400 to-cyan-400',
      'bg-gradient-to-r from-green-400 to-emerald-400',
      'bg-gradient-to-r from-orange-400 to-red-400',
      'bg-gradient-to-r from-indigo-400 to-purple-400',
      'bg-gradient-to-r from-pink-400 to-rose-400',
    ];
    return colors[tag.length % colors.length];
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="text-center">
        <Loader2 className="animate-spin w-12 h-12 text-purple-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading question...</p>
      </div>
    </div>
  );

  if (error || !question) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-3xl p-12 shadow-xl">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4 text-gray-800">{error || 'Question not found'}</h1>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Helmet>
        <title>{question.title} | StackIt</title>
      </Helmet>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-xl border-2 ${
          feedback.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {feedback.message}
          </div>
        </div>
      )}

      {/* Back Button */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Questions
      </Link>

      {/* Question */}
      <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Vote Section */}
          <div className="flex lg:flex-col items-center justify-center gap-4 lg:gap-3 min-w-[100px]">
            <button
              onClick={() => handleVote('up')}
              className="bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-2xl p-3 hover:shadow-lg transition-all hover:scale-105"
            >
              <ThumbsUp className="w-6 h-6" />
            </button>
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 text-white rounded-2xl px-4 py-3 text-center shadow-lg">
              <div className="text-2xl font-bold">{question.votes?.upvotes ?? 0}</div>
              <div className="text-xs font-medium">votes</div>
            </div>
            <button
              onClick={() => handleVote('down')}
              className="bg-gradient-to-br from-red-400 to-pink-500 text-white rounded-2xl p-3 hover:shadow-lg transition-all hover:scale-105"
            >
              <ThumbsDown className="w-6 h-6" />
            </button>
          </div>

          {/* Question Content */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">{question.title}</h1>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {question.tags.map((tag, i) => (
                <span 
                  key={i} 
                  className={`${getTagColor(tag)} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md`}
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose prose-lg max-w-none mb-6">
              <div dangerouslySetInnerHTML={{ __html: question.content }} />
            </div>

            {question.image && (
              <img 
                src={question.image} 
                alt={question.title} 
                className="w-full max-w-2xl rounded-2xl shadow-lg mb-6" 
              />
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                <User className="w-4 h-4" />
                <span className="font-medium">{question.author}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                <Calendar className="w-4 h-4" />
                <span>{new Date(question.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800">
            {answers.length} Answer{answers.length !== 1 ? 's' : ''}
          </h2>
          {isSignedIn && (
            <button
              onClick={() => document.getElementById('answer-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Write Answer
            </button>
          )}
        </div>

        {answerLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin w-10 h-10 text-purple-500" />
          </div>
        ) : answers.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-gray-100">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No answers yet</h3>
            <p className="text-gray-500 mb-6">Be the first to answer this question!</p>
            {isSignedIn && (
              <button
                onClick={() => document.getElementById('answer-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all"
              >
                Write First Answer
              </button>
            )}
          </div>
        ) : (
          answers.map(answer => (
            <div 
              key={answer._id} 
              className={`bg-white rounded-3xl shadow-xl p-8 border-2 transition-all ${
                answer.accepted 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-100 hover:shadow-2xl'
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Vote Section */}
                <div className="flex lg:flex-col items-center justify-center gap-3 min-w-[80px]">
                  <button
                    onClick={() => handleAnswerVote(answer._id, 'up')}
                    className="bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-xl p-2 hover:shadow-lg transition-all hover:scale-105"
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <div className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white rounded-xl px-3 py-2 text-center shadow-lg">
                    <div className="text-lg font-bold">{answer.votes?.upvotes ?? 0}</div>
                  </div>
                  <button
                    onClick={() => handleAnswerVote(answer._id, 'down')}
                    className="bg-gradient-to-br from-red-400 to-pink-500 text-white rounded-xl p-2 hover:shadow-lg transition-all hover:scale-105"
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Answer Content */}
                <div className="flex-1">
                  {answer.accepted && (
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span className="text-green-600 font-semibold">Accepted Answer</span>
                    </div>
                  )}

                  {editingAnswer === answer._id ? (
                    <div className="mb-4">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 resize-none"
                        rows={6}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleEditAnswer(answer._id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingAnswer(null);
                            setEditContent('');
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-lg max-w-none mb-4">
                      <div dangerouslySetInnerHTML={{ __html: answer.content }} />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{answer.author}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(answer.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Accept Answer Button */}
                      {isSignedIn && user?.id === question.clerkUserId && !answer.accepted && (
                        <button
                          onClick={() => handleAcceptAnswer(answer._id)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Accept
                        </button>
                      )}

                      {/* Reply Button */}
                      {isSignedIn && (
                        <button
                          onClick={() => setReplyingTo(replyingTo === answer._id ? null : answer._id)}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Reply className="w-4 h-4" />
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
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                      )}

                      {/* Delete Button */}
                      {isSignedIn && user?.id === answer.clerkUserId && (
                        <button
                          onClick={() => handleDeleteAnswer(answer._id)}
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === answer._id && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply..."
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 resize-none"
                        rows={4}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReplyAnswer(answer._id)}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Reply
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          className="bg-gray-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Answer Form */}
      {isSignedIn && (
        <div id="answer-form" className="bg-white rounded-3xl shadow-xl p-8 mt-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Write Your Answer</h3>
          <form onSubmit={handleSubmitAnswer}>
            <textarea
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              placeholder="Share your knowledge and help others..."
              className="w-full p-6 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 resize-none text-lg"
              rows={8}
              required
            />
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={answerLoading || !answerContent.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {answerLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                {answerLoading ? 'Posting...' : 'Post Answer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isSignedIn && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-8 mt-8 border-2 border-purple-200 text-center">
          <MessageSquare className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Want to answer this question?</h3>
          <p className="text-gray-600 mb-4">Join our community to share your knowledge and help others.</p>
          <button
            onClick={() => navigate('/sign-in')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all"
          >
            Sign In to Answer
          </button>
        </div>
      )}
    </div>
  );
};

export default PostPage;