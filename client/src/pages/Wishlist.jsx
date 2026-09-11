import React, { useEffect, useState } from "react";
import "./Wishlist.css";
import newRequest from "../utils/newRequest";
import ServiceCard from "../components/ServiceCard";
import { Heart } from "lucide-react";

function Wishlist() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await newRequest.get("/users/wishlist");
        setServices(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  return (
    <div className="wishlist">
      <div className="container">
        <div className="header">
          <h1><Heart size={32} fill="#ef4444" color="#ef4444" /> My Wishlist</h1>
          <p>Saved services you're interested in</p>
        </div>
        {loading ? (
          <div className="loading">Loading your wishlist...</div>
        ) : services.length > 0 ? (
          <div className="services-grid">
            {services.map((service) => (
              <ServiceCard key={service._id} item={service} />
            ))}
          </div>
        ) : (
          <div className="empty-wishlist">
            <Heart size={64} color="#e2e8f0" />
            <h3>Your wishlist is empty</h3>
            <p>Explore our marketplace and save services for later!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Wishlist;
