import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import { Helmet } from 'react-helmet';

interface Post {
  _id: string;
  title: string;
  content: string;
  slug: string;
  author: string;
  createdAt: string;
  readTime: number;
  tags: string[];
  excerpt?: string;
  image?: string;
}

const PostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  const fetchPost = async (postSlug: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`https://internship-zm4p.onrender.com/api/posts/${postSlug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Post not found');
        } else {
          setError('Failed to load post');
        }
        return;
      }

      const data = await response.json();
      setPost(data);
      
    } catch (err) {
      setError('Failed to load post');
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading... | BlogHub</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Helmet>
          <title>Post Not Found | BlogHub</title>
          <meta name="description" content="The post you're looking for doesn't exist or has been removed." />
        </Helmet>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {error || 'Post not found'}
            </h1>
            <p className="text-gray-600 mb-8">
              The post you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title || 'Blog Post'} | BlogHub</title>
        <meta name="description" content={post.excerpt || post.title || 'Blog post'} />
        <meta name="keywords" content={post.tags?.join(', ') || 'blog, bloghub'} />

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={post.title || 'Blog Post'} />
        <meta property="og:description" content={post.excerpt || post.title || 'Blog post'} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://yourdomain.com/post/${post.slug}`} />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={post.title || 'Blog Post'} />
        <meta name="twitter:description" content={post.excerpt || post.title || 'Blog post'} />
      </Helmet>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <Link
          to="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Posts
        </Link>

        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              <span className="font-medium">{post.author}</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              <span>{post.readTime} min read</span>
            </div>
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Post Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12">
          {/* Post Image */}
          {post.image && (
            <div className="mb-8">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-96 object-cover rounded-xl shadow-sm border"
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-blockquote:border-blue-200 prose-blockquote:bg-blue-50 prose-blockquote:text-gray-800"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* Post Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-500" />
              <span className="text-gray-600">Written by {post.author}</span>
            </div>
            
            <div className="text-sm text-gray-500">
              Published on {formatDate(post.createdAt)}
            </div>
          </div>
        </footer>
      </article>
    </>
  );
};

export default PostPage;