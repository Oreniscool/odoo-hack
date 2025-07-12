import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useClerk, useUser, SignInButton } from '@clerk/clerk-react';
import { MessageSquare, User, LogOut, PlusCircle, Menu, X, Home, Settings, BookOpen, Bell } from 'lucide-react';
import {useNotifications} from '../hooks/useNotifications.js'

// Define a type for your notification object
interface Notification {
  _id: string;
  type: string; // e.g., 'answer_to_your_question', 'mention_in_answer', 'comment_on_your_answer', 'answer_vote_received', 'answer_accepted'
  message: string;
  isRead: boolean;
  createdAt: string; // Date string
  // Add other fields relevant to your notification structure (e.g., questionId, answerId)
  questionId?: string;
  answerId?: string;
  parentAnswerId?: string;
  replyId?: string;
}

const Navbar: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Ref for clicking outside the notification dropdown
  const notificationRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMobileMenuOpen(false);
    // Clear notifications on sign out
    setNotifications([]);
    setUnreadCount(0);
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;

    setNotificationsLoading(true);
    try {
      // --- REPLACE WITH YOUR ACTUAL API CALL ---
      // Example:
      const response = await fetch(`http://localhost:5001/api/notifications/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data: Notification[] = await response.json();
      setNotifications(data);

      // Mock data for demonstration
      const mockNotifications: Notification[] = [
        { _id: 'n1', type: 'answer_to_your_question', message: 'John answered your question: "How to use React Hooks?"', isRead: false, createdAt: '2025-07-10T10:00:00Z', questionId: 'q1' },
        { _id: 'n2', type: 'mention_in_answer', message: 'Alice mentioned you in an answer.', isRead: false, createdAt: '2025-07-09T15:30:00Z', answerId: 'a1' },
        { _id: 'n3', type: 'comment_on_your_answer', message: 'Bob commented on your answer.', isRead: true, createdAt: '2025-07-08T11:45:00Z', parentAnswerId: 'pa1' },
        { _id: 'n4', type: 'answer_accepted', message: 'Your answer was accepted!', isRead: false, createdAt: '2025-07-07T09:00:00Z', answerId: 'a2' },
        { _id: 'n5', type: 'answer_vote_received', message: 'Your answer received an upvote!', isRead: true, createdAt: '2025-07-06T14:00:00Z', answerId: 'a3' },
      ];
      setNotifications(mockNotifications);
      // --- END MOCK DATA ---

      const currentUnreadCount = mockNotifications.filter(n => !n.isRead).length;
      setUnreadCount(currentUnreadCount);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      // You might want to show a toast or message to the user
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch notifications when user signs in or user ID becomes available
    if (isSignedIn && user?.id) {
      fetchNotifications();
    }
  }, [isSignedIn, user?.id]); // Depend on isSignedIn and user.id

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationRef]);

  const handleNotificationClick = (notification: Notification) => {
    // Optionally mark as read
    // You'd also call an API to mark it as read on the backend
    // setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
    // setUnreadCount(prev => prev - (notification.isRead ? 0 : 1));

    setShowNotifications(false); // Close dropdown
    // Navigate to the relevant post/answer
    if (notification.questionId) {
      navigate(`/post/${notification.questionId}#${notification.answerId || ''}`);
    } else if (notification.answerId) {
      // If it's a comment, you might want to navigate to the parent answer or the question it belongs to
      // This logic depends on how your answers/comments are linked
      navigate(`/post/${notification.parentAnswerId || notification.answerId}`); // Adjust this based on your routing
    }
  };

  const markAllAsRead = async () => {
    // Call API to mark all as read
    // await fetch(`/api/notifications/mark-all-read/${user.id}`, { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent tracking-tight hover:scale-105 transition-transform"
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-2xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span>StackIt</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
                isActive('/')
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-purple-600'
              }`}
            >
              <Home className="w-4 h-4 inline mr-2" />
              Home
            </Link>

            {isSignedIn && (
              <Link
                to="/create"
                className={`flex items-center gap-2 px-6 py-2 rounded-2xl font-semibold transition-all duration-300 ${
                  isActive('/create')
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                Ask Question
              </Link>
            )}

            {isSignedIn && (
              <Link
                to="/user"
                className={`px-4 py-2 rounded-2xl font-medium transition-all duration-300 ${
                  isActive('/user')
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                My Questions
              </Link>
            )}
          </div>

          {/* User Menu & Notifications */}
          <div className="hidden md:flex items-center gap-4">
            {isSignedIn && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-2xl text-gray-600 hover:bg-gray-100 relative transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 animate-fade-in-down max-h-96 overflow-y-auto">
                    <div className="flex justify-between items-center p-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    {notificationsLoading ? (
                      <div className="p-4 text-center text-gray-500">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No new notifications.</div>
                    ) : (
                      <ul>
                        {notifications.map((notification) => (
                          <li
                            key={notification._id}
                            className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                              !notification.isRead ? 'bg-blue-50' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <p className={`text-sm ${!notification.isRead ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                              {notification.message}
                            </p>
                            <span className="text-xs text-gray-500 mt-1 block">
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            {isSignedIn ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center shadow-md">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user?.firstName || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-200">
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Notification Bell */}
            {isSignedIn && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-6 h-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation and Notification Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col gap-3">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                  isActive('/')
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="w-5 h-5" />
                Home
              </Link>

              {isSignedIn && (
                <Link
                  to="/create"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                    isActive('/create')
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  }`}
                >
                  <PlusCircle className="w-5 h-5" />
                  Ask Question
                </Link>
              )}

              {isSignedIn && (
                <Link
                  to="/user"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-300 ${
                    isActive('/user')
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  My Questions
                </Link>
              )}

              {/* Mobile Notification Dropdown (inside mobile menu) */}
              {showNotifications && ( // Only show if mobile menu AND notification dropdown are open
                <div className="mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 animate-fade-in-down max-h-80 overflow-y-auto">
                  <div className="flex justify-between items-center p-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  {notificationsLoading ? (
                    <div className="p-4 text-center text-gray-500">Loading notifications...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No new notifications.</div>
                  ) : (
                    <ul>
                      {notifications.map((notification) => (
                        <li
                          key={notification._id}
                          className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            handleNotificationClick(notification);
                            setIsMobileMenuOpen(false); // Close mobile menu after clicking notification
                          }}
                        >
                          <p className={`text-sm ${!notification.isRead ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-500 mt-1 block">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {isSignedIn ? (
                <div className="flex flex-col gap-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user?.firstName || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-gray-200">
                  <SignInButton mode="modal">
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300"
                    >
                      <User className="w-5 h-5" />
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;