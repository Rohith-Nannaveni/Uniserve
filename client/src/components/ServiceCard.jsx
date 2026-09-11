import React, { useEffect, useState } from "react";
import "./ServiceCard.css";
import { Link } from "react-router-dom";
import newRequest from "../utils/newRequest";
import { Star, Heart } from "lucide-react";
import { categoryDefaults, profileDefault, imageDefault } from "../utils/constants";

function ServiceCard({ item }) {
  const [user, setUser] = useState({});
  const [isWishlisted, setIsWishlisted] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await newRequest.get(`/users/${item.userId}`);
        setUser(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchUser();
    
    // Check if item is in current user's wishlist
    if (currentUser?.wishlist?.includes(item._id)) {
      setIsWishlisted(true);
    }
  }, [item.userId, item._id]);

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Please login to use wishlist");
    try {
      const res = await newRequest.put(`/users/wishlist/${item._id}`);
      setIsWishlisted(!isWishlisted);
      // Update local storage
      const updatedUser = { ...currentUser, wishlist: res.data };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="serviceCardContainer">
      <Link to={`/service/${item._id}`} className="link">
        <div className="serviceCard">
          <img className="cover" src={item.cover || categoryDefaults[item.cat] || imageDefault} alt="" />
          <div className="info">
            <div className="user">
              <img src={user.img || profileDefault} alt="" />
              <span>{user.username}</span>
            </div>
            <p>{item.desc}</p>
            <div className="star">
              <Star size={14} fill="gold" color="gold" />
              <span>
                {!isNaN(item.totalStars / item.starNumber) &&
                  Math.round(item.totalStars / item.starNumber)}
              </span>
            </div>
          </div>
          <hr />
          <div className="detail">
            <div className="price">
              <span>STARTING AT</span>
              <h2>₹ {item.price}</h2>
            </div>
          </div>
        </div>
      </Link>
      <button className={`wishlistBtn ${isWishlisted ? "active" : ""}`} onClick={handleWishlist}>
        <Heart size={20} fill={isWishlisted ? "#ef4444" : "none"} color={isWishlisted ? "#ef4444" : "#94a3b8"} />
      </button>
    </div>
  );
}

export default ServiceCard;
