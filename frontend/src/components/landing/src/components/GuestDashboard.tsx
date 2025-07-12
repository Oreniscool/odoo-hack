import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ThumbsUp, 
  MessageCircle, 
  Eye, 
  Tag,
  Clock,
  User,
  CheckCircle,
  ArrowLeft,
  Star,
  TrendingUp
} from 'lucide-react';

interface GuestDashboardProps {
  onBackClick: () => void;
}

const GuestDashboard: React.FC<GuestDashboardProps> = ({ onBackClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  const questions = [
    {
      id: 1,
      title: "How to implement user authentication in React with JWT?",
      description: "I'm building a React application and need to implement secure user authentication using JWT tokens. Looking for best practices...",
      author: "john_dev",
      timeAgo: "2 hours ago",
      views: 245,
      votes: 12,
      answers: 5,
      tags: ["React", "JWT", "Authentication"],
      isAccepted: true,
      status: "solved"
    },
    {
      id: 2,
      title: "Best practices for state management in large React applications?",
      description: "Working on a large-scale React project and considering different state management solutions. What are the pros and cons of Redux vs Context API?",
      author: "sarah_coder",
      timeAgo: "5 hours ago",
      views: 189,
      votes: 8,
      answers: 3,
      tags: ["React", "Redux", "State Management"],
      isAccepted: false,
      status: "open"
    },
    {
      id: 3,
      title: "TypeScript generic constraints with conditional types",
      description: "Struggling with advanced TypeScript patterns. How can I create generic types with constraints that work with conditional types?",
      author: "ts_expert",
      timeAgo: "1 day ago",
      views: 156,
      votes: 15,
      answers: 7,
      tags: ["TypeScript", "Generics", "Advanced"],
      isAccepted: true,
      status: "solved"
    },
    {
      id: 4,
      title: "Optimizing database queries for better performance",
      description: "My application is experiencing slow database queries. What are some general optimization techniques for improving query performance?",
      author: "db_admin",
      timeAgo: "3 days ago",
      views: 312,
      votes: 22,
      answers: 9,
      tags: ["Database", "Performance", "SQL"],
      isAccepted: true,
      status: "solved"
    },
    {
      id: 5,
      title: "CSS Grid vs Flexbox: When to use which?",
      description: "I'm confused about when to use CSS Grid versus Flexbox for layouts. Can someone explain the use cases for each?",
      author: "css_learner",
      timeAgo: "1 week ago",
      views: 445,
      votes: 28,
      answers: 12,
      tags: ["CSS", "Layout", "Frontend"],
      isAccepted: true,
      status: "solved"
    }
  ];

  const tags = ["All", "React", "TypeScript", "CSS", "Database", "JWT", "Performance"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'solved': return 'bg-gradient-success';
      case 'open': return 'bg-gradient-warning';
      default: return 'bg-gradient-secondary';
    }
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         question.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || selectedTag === 'All' ||
                      question.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase());
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackClick}
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Landing</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-800">
                Guest Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                👋 Browsing as Guest
              </span>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedTag === tag || (selectedTag === 'all' && tag === 'All')
                      ? 'bg-gradient-primary text-white shadow-lg'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-gray-800">{questions.length}</span>
              </div>
              <span className="text-sm text-gray-600">Total Questions</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-gray-800">
                  {questions.filter(q => q.status === 'solved').length}
                </span>
              </div>
              <span className="text-sm text-gray-600">Solved</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-800">
                  {questions.reduce((acc, q) => acc + q.views, 0)}
                </span>
              </div>
              <span className="text-sm text-gray-600">Total Views</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="text-2xl font-bold text-gray-800">98%</span>
              </div>
              <span className="text-sm text-gray-600">Success Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {filteredQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Vote and stats column */}
                <div className="flex lg:flex-col items-center lg:items-start gap-4 lg:gap-2 text-center">
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="w-4 h-4 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-700">{question.votes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-lg font-semibold text-gray-700">{question.answers}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{question.views}</span>
                  </div>
                </div>

                {/* Question content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-purple-600 transition-colors leading-tight">
                      {question.title}
                    </h3>
                    {question.isAccepted && (
                      <CheckCircle className="w-6 h-6 text-green-500 ml-2 flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {question.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {question.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm rounded-full border border-purple-200"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className={`px-3 py-1 text-white text-xs rounded-full ${getStatusColor(question.status)}`}>
                      {question.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{question.author}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{question.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No questions found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Guest CTA */}
        <div className="mt-12 bg-gradient-primary rounded-3xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Ready to Join the Community?</h3>
          <p className="text-lg opacity-90 mb-6">
            Sign up to ask questions, provide answers, and earn reputation points
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:scale-105">
              Create Account
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-purple-600 transition-all duration-200">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;