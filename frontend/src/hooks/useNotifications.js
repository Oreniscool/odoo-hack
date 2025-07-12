import { useEffect, useState } from "react";
import socket from "../utils/socket.js";
import axiosInstance from "../utils/axios.js";

const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    socket.emit("register", userId);
    axiosInstance.get(`/notifications/${userId}`).then((res) => {
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.isRead).length);
    });

    socket.on("notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((count) => count + 1);
    });

    return () => {
      socket.off("notification");
    };
  }, [userId]);

  const markAllAsRead = async () => {
    await axiosInstance.put(`/notifications/${userId}/mark-all-read`);
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAllAsRead };
};

export default useNotifications;