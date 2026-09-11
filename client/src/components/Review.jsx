import React, { useEffect, useState } from "react";
import { Star, Edit2, Trash2, X, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import newRequest from "../utils/newRequest";
import "./Review.css";
import { profileDefault } from "../utils/constants";

const Review = ({ review, onUpdate }) => {
  const [user, setUser] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(review.desc);
  const [editStar, setEditStar] = useState(review.star);
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await newRequest.get(`/users/${review.userId}`);
        setUser(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchUser();
  }, [review.userId]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      await newRequest.delete(`/reviews/${review._id}`);
      onUpdate();
    } catch (err) {
      console.log(err);
    }
  };

  const handleUpdate = async () => {
    try {
      await newRequest.put(`/reviews/${review._id}`, {
        desc: editDesc,
        star: editStar,
      });
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="review">
      <div className="review-header">
        <div className="user">
          <img
            className="pp"
            src={user.img || profileDefault}
            alt=""
          />
          <div className="info">
            <span>{user.username}</span>
            <div className="country">
              <span>{user.country}</span>
            </div>
          </div>
        </div>
        
        {currentUser?._id === review.userId && !isEditing && (
          <div className="review-actions">
            <button className="action-icon edit" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} />
            </button>
            <button className="action-icon delete" onClick={handleDelete}>
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="edit-review-form">
          <select value={editStar} onChange={(e) => setEditStar(parseInt(e.target.value))}>
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num} Stars</option>
            ))}
          </select>
          <textarea 
            value={editDesc} 
            onChange={(e) => setEditDesc(e.target.value)}
            rows={3}
          />
          <div className="edit-actions">
            <button className="cancel-btn" onClick={() => setIsEditing(false)}>
              <X size={16} /> Cancel
            </button>
            <button className="save-btn" onClick={handleUpdate}>
              <Check size={16} /> Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="stars">
            {Array(review.star)
              .fill()
              .map((item, i) => (
                <Star key={i} size={14} fill="gold" color="gold" />
              ))}
            <span>{review.star}</span>
          </div>
          <p>{review.desc}</p>
        </>
      )}
      
      <div className="helpful">
        <span>Helpful?</span>
        <ThumbsUp size={16} />
        <span>Yes</span>
        <ThumbsDown size={16} />
        <span>No</span>
      </div>
    </div>
  );
};

export default Review;
