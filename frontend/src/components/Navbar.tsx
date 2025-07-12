import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useClerk, useUser, SignInButton } from "@clerk/clerk-react";
import {
  MessageSquare,
  User,
  LogOut,
  PlusCircle,
  Menu,
  X,
  Home,
  Settings,
  BookOpen,
  Bell,
} from "lucide-react";
import axios from "axios";
import { io } from "socket.io-client";
const socket = io("http://localhost:5001");
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
const useNotifications = (userId: string | undefined) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    socket.emit("register", userId);

    const fetchInitialNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5001/api/notifications/${userId}`);
        const fetchedNotifications: Notification[] = response.data;
        setNotifications(fetchedNotifications);
        setUnreadCount(fetchedNotifications.filter((n) => !n.isRead).length);
      } catch (err) {
        console.error("Error fetching initial notifications:", err);
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialNotifications();

    const handleNewNotification = (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((count) => count + 1);
    };

    socket.on("notification", handleNewNotification);

    return () => {
      socket.off("notification", handleNewNotification);
      // It's good practice to unregister the user when the component unmounts
      // or userId changes, if your socket server supports it.
      // socket.emit("unregister", userId);
    };
  }, [userId]);

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await axios.put(`http://localhost:5001/api/notifications/${userId}/mark-all-read`);
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      // Handle error, e.g., show a toast
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!userId) return;
    try {
      await axios.put(
        `http://localhost:5001/api/notifications/${userId}/mark-read/${notificationId}`
      );
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(
        `Error marking notification ${notificationId} as read:`,
        err
      );
    }
  };

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    markNotificationAsRead,
    loading,
    error,
  };
};

const Navbar: React.FC = () => {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Pass user?.id to the custom hook
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    markNotificationAsRead,
    loading: notificationsLoading,
    error: notificationsError,
  } = useNotifications(user?.id);

  // Ref for clicking outside the notification dropdown
  const notificationRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsMobileMenuOpen(false);
    // The useNotifications hook will handle clearing notifications
    // when user.id becomes undefined after signOut.
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }
    // Navigate based on notification type if needed
    if (notification.questionId) {
      navigate(`/questions/${notification.questionId}`);
    } else if (notification.answerId) {
      // You might want to navigate to the specific answer or its parent question
      navigate(`/answers/${notification.answerId}`); // Example
    }
    setShowNotifications(false); // Close dropdown after clicking
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

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
                isActive("/")
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100 hover:text-purple-600"
              }`}
            >
              <Home className="w-4 h-4 inline mr-2" />
              Home
            </Link>

            {isSignedIn && (
              <Link
                to="/create"
                className={`flex items-center gap-2 px-6 py-2 rounded-2xl font-semibold transition-all duration-300 ${
                  isActive("/create")
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105"
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
                  isActive("/user")
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100 hover:text-blue-600"
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
                      <h3 className="font-semibold text-gray-800">
                        Notifications
                      </h3>
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
                      <div className="p-4 text-center text-gray-500">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No new notifications.
                      </div>
                    ) : (
                      <ul>
                        {notifications.map((notification) => (
                          <li
                            key={notification._id}
                            className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                              !notification.isRead ? "bg-blue-50" : ""
                            }`}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            <p
                              className={`text-sm ${
                                !notification.isRead
                                  ? "font-medium text-blue-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {notification.message}
                            </p>
                            <span className="text-xs text-gray-500 mt-1 block">
                              {new Date(
                                notification.createdAt
                              ).toLocaleString()}
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
                        alt={user?.firstName || "User"}
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
                  isActive("/")
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100"
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
                    isActive("/create")
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg"
                      : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
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
                    isActive("/user")
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                      : "text-gray-600 hover:bg-gray-100"
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
                    <h3 className="font-semibold text-gray-800">
                      Notifications
                    </h3>
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
                    <div className="p-4 text-center text-gray-500">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No new notifications.
                    </div>
                  ) : (
                    <ul>
                      {notifications.map((notification) => (
                        <li
                          key={notification._id}
                          className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                            !notification.isRead ? "bg-blue-50" : ""
                          }`}
                          onClick={() => {
                            handleNotificationClick(notification);
                            setIsMobileMenuOpen(false); // Close mobile menu after clicking notification
                          }}
                        >
                          <p
                            className={`text-sm ${
                              !notification.isRead
                                ? "font-medium text-blue-700"
                                : "text-gray-700"
                            }`}
                          >
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
                          alt={user?.firstName || "User"}
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
