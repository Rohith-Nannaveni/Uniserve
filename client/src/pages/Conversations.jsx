import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Conversations.css";
import axios from "axios";
import moment from "moment";
import newRequest from "../utils/newRequest";
import { profileDefault } from "../utils/constants";
import { Trash2 } from "lucide-react";

const Conversations = () => {
  const [conversations, setConversations] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const handleRedirect = async () => {
      const to = new URLSearchParams(search).get("to");
      if (to) {
        try {
          const res = await newRequest.post("/conversations", { to });
          navigate(`/message/${res.data.id}`);
        } catch (err) {
          console.log(err);
        }
      }
    };
    handleRedirect();

    const getConversations = async () => {
      try {
        const res = await newRequest.get(`/conversations`);
        setConversations(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getConversations();
  }, []);

  const handleChat = async (id) => {
    try {
      await newRequest.put(`/conversations/${id}`);
      navigate(`/message/${id}`);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (window.confirm("Are you sure you want to delete this chat entry?")) {
      try {
        await newRequest.put(`/conversations/delete/${id}`);
        setConversations((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.log(err);
      }
    }
  };

  return (
    <div className="conversations">
        <div className="container">
          <div className="title">
            <h1>Conversations</h1>
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Last Message</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => {
                const isUserSeller = currentUser._id === c.sellerId;
                const isUnread = isUserSeller ? !c.readBySeller : !c.readByBuyer;
                
                return (
                  <tr
                    className={isUnread ? "active" : ""}
                    key={c.id}
                  >
                    <td>
                      <div className="user-info">
                        <img 
                          src={c.otherImg || profileDefault} 
                          alt="" 
                          onError={(e) => { e.target.onerror = null; e.target.src = profileDefault; }}
                        />
                        <span>{c.otherUsername}</span>
                      </div>
                    </td>
                    <td>
                      <Link to={`/message/${c.id}`} className="link">
                        {c.lastMessage?.substring(0, 100)}...
                      </Link>
                    </td>
                    <td>{moment(c.updatedAt).fromNow()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="chat-btn" onClick={() => handleChat(c.id)}>
                          Chat
                        </button>
                        <button className="delete-btn" onClick={() => handleDeleteEntry(c.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
  );
};

export default Conversations;
