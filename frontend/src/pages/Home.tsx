import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronDown, PlusCircle, MessageSquare, User, Loader2, TrendingUp, Clock, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useUser } from '@clerk/clerk-react';

interface Question {
  _id: string;
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  createdAt: string;
  tags: string[];
  image?: string | null;
  votes?: { upvotes: number; downvotes: number };
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
}

const FILTERS = [
  { label: 'Trending', value: 'latest', icon: TrendingUp },
  { label: 'Latest', value: 'latest', icon: Clock },
  { label: 'Unanswered', value: 'unanswered', icon: Zap },
  { label: 'Oldest', value: 'oldest', icon: Clock },
];

const Home: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerCounts, setAnswerCounts] = useState<{[key:string]:number}>({});
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('latest');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  useEffect(() => {
    fetchQuestions(currentPage, filter);
  }, [currentPage, filter]);

  const fetchQuestions = async (page: number, sortBy: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5001/api/questions?page=${page}&limit=6&sortBy=${sortBy}`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      const data = await response.json();
      setQuestions(data.posts);
      setPagination(data.pagination);
      
      // Fetch answer counts for all questions
      const counts: {[key:string]:number} = {};
      await Promise.all(data.posts.map(async (q: any) => {
        try {
          const res = await fetch(`http://localhost:5001/api/answers/question/${q._id}`);
          if (res.ok) {
            const answers = await res.json();
            counts[q._id] = answers.length;
          } else {
            counts[q._id] = 0;
          }
        } catch (err) {
          counts[q._id] = 0;
        }
      }));
      setAnswerCounts(counts);
    } catch (error) {
      setError('Failed to load questions. Please try again.');
      setQuestions([]);
      setPagination(null);
      setAnswerCounts({});
    } finally {
      setLoading(false);
    }
  };

  let filteredQuestions = questions.filter(q =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  if (filter === 'unanswered') {
    filteredQuestions = filteredQuestions.filter(q => answerCounts[q._id] === 0);
  }

  const getVoteColor = (votes: number) => {
    if (votes > 10) return 'from-emerald-400 to-green-500';
    if (votes > 5) return 'from-blue-400 to-indigo-500';
    if (votes > 0) return 'from-yellow-400 to-orange-500';
    return 'from-gray-400 to-gray-500';
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>StackIt | Home</title>
      </Helmet>
      
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          <h1 className="text-6xl font-extrabold mb-4">StackIt</h1>
        </div>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Ask, answer, and discover programming questions in a vibrant community of developers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg"
          >
            <PlusCircle className="w-6 h-6" /> Ask New Question
          </button>
          {!isSignedIn && (
            <button
              onClick={() => navigate('/sign-in')}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-semibold text-lg"
            >
              <User className="w-6 h-6" /> Join Community
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div className="flex flex-wrap gap-3">
          {FILTERS.map(f => {
            const IconComponent = f.icon;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium border-2 transition-all duration-300 ${
                  filter === f.value 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-lg' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search questions, tags, or content..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all bg-white shadow-lg text-lg"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-8">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-center">
              <Loader2 className="animate-spin w-12 h-12 text-purple-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading amazing questions...</p>
            </div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl p-12 shadow-xl max-w-md mx-auto">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No questions found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Be the first to ask a question!'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/create')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Ask First Question
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredQuestions.map(q => (
            <div key={q._id} className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 group border border-gray-100">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Vote Stats */}
                <div className="flex lg:flex-col items-center justify-center gap-4 lg:gap-3 min-w-[120px]">
                  <div className={`bg-gradient-to-br ${getVoteColor(q.votes?.upvotes ?? 0)} text-white rounded-2xl px-4 py-3 text-center shadow-lg`}>
                    <div className="text-2xl font-bold">{q.votes?.upvotes ?? 0}</div>
                    <div className="text-xs font-medium">votes</div>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white rounded-2xl px-4 py-3 text-center shadow-lg flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <div>
                      <div className="text-2xl font-bold">{answerCounts[q._id] ?? 0}</div>
                      <div className="text-xs font-medium">answers</div>
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="flex-1">
                  <Link 
                    to={`/post/${q.slug}`} 
                    className="text-3xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300 mb-4 block"
                  >
                    {q.title}
                  </Link>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {q.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className={`${getTagColor(tag)} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:scale-105 transition-transform`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-gray-600 text-lg mb-4 line-clamp-3 leading-relaxed">
                    {q.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{q.author}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(q.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>

                {/* Question Image */}
                {q.image && (
                  <div className="lg:w-48 lg:h-32 flex-shrink-0">
                    <img 
                      src={q.image} 
                      alt={q.title} 
                      className="w-full h-full object-cover rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-12">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-6 py-3 rounded-2xl border-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            Previous
          </button>
          
          <div className="flex gap-2">
            {[...Array(pagination.pages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-4 py-3 rounded-2xl border-2 font-medium transition-all ${
                  currentPage === i + 1 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent shadow-lg' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pagination.pages}
            className="px-6 py-3 rounded-2xl border-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;