import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./Message.css";
import newRequest from "../utils/newRequest";
import { io } from "socket.io-client";
import { profileDefault } from "../utils/constants";

const Message = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  // const [socket, setSocket] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const desc = e.target[0].value;
    if (!desc) return;

    try {
      const res = await newRequest.post(`/messages`, {
        conversationId: id,
        desc,
      });
      // Optimistic update for the sender
      setMessages((prev) => [...prev, res.data]);
      e.target[0].value = "";
    } catch (err) {
      console.log(err);
    }
  };

  const [conversation, setConversation] = useState(null);

  const fetchMessages = async () => {
    try {
      const res = await newRequest.get(`/messages/${id}`);
      setMessages(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchConversation = async () => {
    try {
      const res = await newRequest.get(`/conversations/single/${id}`);
      setConversation(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchConversation();
    
    // Mark as read
    const markAsRead = async () => {
      try {
        await newRequest.put(`/conversations/${id}`);
      } catch (err) {
        console.log("Failed to mark as read:", err);
      }
    };
    markAsRead();
  }, [id]);

  useEffect(() => {
    const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    const s = io(SOCKET_URL, {
      withCredentials: true,
    });
    // setSocket(s);
    s.emit("join", currentUser._id);

    s.on("message", (data) => {
      if (data.conversationId === id && data.userId !== currentUser._id) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => {
      s.disconnect();
    };
  }, [id, currentUser._id]);

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear this entire chat history?")) {
      try {
        await newRequest.put(`/conversations/clear/${id}`);
        setMessages([]); // Clear local UI
      } catch (err) {
        console.log(err);
      }
    }
  };

  return (
    <div className="message">
        <div className="container">
          <div className="message-header">
            <span className="breadcrumbs">
              <Link to="/messages" className="link">Messages</Link> &gt; {conversation?.otherUsername || "User"} &gt;
            </span>
            <button className="clear-chat-btn" onClick={handleClearChat}>
              Clear Chat
            </button>
          </div>
          <div className="messages">
            {messages.map((m) => (
              <div
                className={m.userId === currentUser._id ? "owner item" : "item"}
                key={m._id}
              >
                <img
                  src={m.userId === currentUser._id ? (currentUser.img || profileDefault) : (conversation?.otherImg || profileDefault)}
                  alt=""
                  onError={(e) => { e.target.onerror = null; e.target.src = profileDefault; }}
                />
                <p>{m.desc}</p>
              </div>
            ))}
          </div>
          <hr />
          <form className="write" onSubmit={handleSubmit}>
            <textarea placeholder="write a message" cols="30" rows="10"></textarea>
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
  );
};

export default Message;
