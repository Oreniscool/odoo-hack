import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Search } from 'lucide-react';
import { Helmet } from 'react-helmet';

interface Post {
  _id: string;
  title: string;
  excerpt: string;
  slug: string;
  author: string;
  createdAt: string;
  readTime: number;
  tags: string[];
  image?: string | null;
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
}

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);

  const fetchPosts = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`https://internship-zm4p.onrender.com/api/posts?page=${page}&limit=6`);
      const data = await response.json();
      setPosts(data.posts);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>BlogHub | Discover Tech Blogs & Tutorials</title>
        <meta
          name="description"
          content="Stay updated with high-quality tech blogs, tutorials, and stories on web development, JavaScript, React, and more."
        />
        <meta
          name="keywords"
          content="bloghub, tech blog, react, javascript, web development, programming tutorials"
        />
        <meta property="og:title" content="BlogHub | Discover Tech Blogs & Tutorials" />
        <meta
          property="og:description"
          content="Explore insightful blogs, developer guides, and stories from the BlogHub community."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/" />
      </Helmet>

      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary-900 mb-6">
          Welcome to <span className="text-accent-600">BlogHub</span>
        </h1>
        <p className="text-xl text-primary-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Discover insights, stories, and knowledge from our community of writers
        </p>
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-primary-400" />
          </div>
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-3 border border-primary-300 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200 bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-primary-500 text-lg">
            {searchTerm ? 'No posts found matching your search.' : 'No posts available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredPosts.map((post) => (
            <article
              key={post._id}
              className="card hover:shadow-md transition-all duration-300 group"
            >
              {/* Post Image */}
              {post.image && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-primary-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(post.createdAt)}
                  </div>
                  <div className="flex items-center text-sm text-primary-500">
                    <Clock className="h-4 w-4 mr-2" />
                    {post.readTime} min read
                  </div>
                </div>

                <h2 className="text-xl font-semibold text-primary-900 mb-3 line-clamp-2 group-hover:text-accent-600 transition-colors">
                  {post.title}
                </h2>

                <p className="text-primary-600 mb-4 line-clamp-3 leading-relaxed">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-primary-700">
                    by {post.author}
                  </span>

                  <Link
                    to={`/post/${post.slug}`}
                    className="inline-flex items-center text-accent-600 hover:text-accent-700 font-medium text-sm transition-colors"
                  >
                    Read more
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-accent-50 text-accent-700 text-xs rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Previous
          </button>
          
          <span className="px-4 py-2 text-sm text-primary-600">
            Page {currentPage} of {pagination.pages}
          </span>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pagination.pages}
            className="px-4 py-2 text-sm font-medium text-primary-600 bg-white border border-primary-300 rounded-lg hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;