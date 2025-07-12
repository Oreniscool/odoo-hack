import { useEffect, useState } from "react";
import socket from "../utils/socket.js";

const useMessages = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("answer", (newAnswer) => {
      setMessages((prev) => [newAnswer, ...prev]);
    });

    return () => {
      socket.off("answer");
    };
  }, []);

  return { messages };
};

export default useMessages;
