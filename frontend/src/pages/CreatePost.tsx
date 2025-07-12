import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Helmet } from 'react-helmet';

const CreatePost: React.FC = () => {
  const { user, isSignedIn } = useUser();
  const clerkUserId = user?.id ;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    published: true,
    tags: '',
  });
  const [loading, setLoading] = useState(false);
const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.title.trim() || !formData.content.trim()) {
    alert('Please fill in all required fields');
    return;
  }

  setLoading(true);

  const form = new FormData();
  form.append('title', formData.title.trim());
  form.append('content', formData.content);
  form.append('author', user?.firstName || user?.emailAddresses[0]?.emailAddress || 'Admin');
  form.append('published', String(formData.published));
  form.append('tags', JSON.stringify(formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)));
  form.append('clerkUserId', clerkUserId || '');

  if (imageFile) {
    form.append('image', imageFile);
  }

  try {
    const response = await fetch('https://internship-zm4p.onrender.com/api/posts', {
      method: 'POST',
      body: form
    });

    if (response.ok) {
      if(user?.publicMetadata?.role === "admin"){
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } else {
      const error = await response.json();
      alert(error.error || 'Failed to create post');
    }
  } catch (error) {
    console.error('Error creating post:', error);
    alert('Failed to create post');
  } finally {
    setLoading(false);
  }
};


  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['blockquote', 'code-block'],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'color', 'background',
    'link', 'image', 'blockquote', 'code-block', 'align'
  ];

  return (
    <>
    <Helmet>
  <title>Create New Post | BlogHub</title>
  <meta name="description" content="Use the BlogHub editor to create, edit, and publish your own blog posts. Share your insights with the world." />
  <meta name="keywords" content="create blog, write blog, publish blog, BlogHub editor, new post" />

  {/* Open Graph Meta Tags */}
  <meta property="og:title" content="Create New Post | BlogHub" />
  <meta property="og:description" content="Write and publish your blog posts with BlogHub's rich text editor." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://yourdomain.com/create" />

  {/* Twitter Cards */}
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Create New Post | BlogHub" />
  <meta name="twitter:description" content="Use BlogHub to create and share new blog posts easily." />
</Helmet>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to={user?.publicMetadata?.role === "admin" ? "/admin" : "/user"}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900">Create New Post</h1>
        <p className="text-gray-600 mt-2">Write and publish your blog post</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter post title..."
              required
            />
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="react, javascript, web development"
            />
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <div className="bg-white rounded-md border border-gray-300">
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your post content here..."
                style={{ minHeight: '300px' }}
              />
            </div>
          </div>

 {/* Image Upload */}
            <div className="mb-6">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                Upload Cover Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mt-4 w-full max-w-xs rounded-lg shadow-md"
                />
              )}
            </div>
          {/* Published Toggle */}
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="published"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
                Publish immediately
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Uncheck to save as draft
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Link
              to="/user"
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, published: false })}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Save as Draft
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {formData.published ? 'Publish Post' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
    </>
  );
};

export default CreatePost;

