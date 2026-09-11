import React, { useEffect, useState } from "react";
import "./Service.css";
import { Link, useParams, useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";
import { Star, Check, MessageCircle } from "lucide-react";
import Review from "../components/Review";
import { profileDefault } from "../utils/constants";

function Service() {
  const { id } = useParams();
  const [service, setService] = useState({});
  const [user, setUser] = useState({});
  const [reviews, setReviews] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const fetchReviews = async () => {
    try {
      const res = await newRequest.get(`/reviews/${id}`);
      setReviews(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await newRequest.get(`/services/single/${id}`);
        setService(res.data);
        setSelectedImage(res.data.cover);
        const userRes = await newRequest.get(`/users/${res.data.userId}`);
        setUser(userRes.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchService();
    fetchReviews();
  }, [id]);

  useEffect(() => {
    const checkPurchase = async () => {
      if (currentUser) {
        try {
          // Get all completed orders for this service by this user
          const res = await newRequest.get(`/orders?buyerId=${currentUser._id}&serviceId=${id}`);
          const completedOrders = res.data.filter(o => o.serviceId === id && o.isCompleted);
          
          // Check which orders already have a review
          const reviewedOrderIds = reviews.map(r => r.orderId);
          const unreviewed = completedOrders.filter(o => !reviewedOrderIds.includes(o._id));
          
          setPendingOrders(unreviewed);
        } catch (err) {
          console.log(err);
        }
      }
    };
    checkPurchase();
  }, [id, currentUser, reviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const desc = e.target[0].value;
    const star = e.target[1].value;
    const orderId = pendingOrders[0]?._id; // Review the oldest unreviewed order

    if (!orderId) return;

    try {
      await newRequest.post("/reviews", { serviceId: id, orderId, desc, star });
      fetchReviews();
      e.target[0].value = "";
    } catch (err) {
      setError(err.response?.data || "Something went wrong!");
    }
  };

  const handlePurchase = async () => {
    if (!currentUser) {
      alert("Please sign in to proceed with the purchase.");
      navigate("/login");
      return;
    }

    if (service.userId === currentUser._id) {
      alert("You cannot book your own service!");
      return;
    }

    navigate(`/pay/${id}`);
  };

  const handleContact = async () => {
    if (!currentUser) {
      alert("Please sign in to contact the seller.");
      navigate("/login");
      return;
    }

    const sellerId = user._id;
    const buyerId = currentUser._id;
    
    if (!sellerId) {
      alert("Seller information is unavailable. This service profile may have been deleted.");
      return;
    }

    const ids = [sellerId, buyerId].sort();
    const conversationId = ids[0] + ids[1];

    try {
      const res = await newRequest.get(`/conversations/single/${conversationId}`);
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        try {
          const res = await newRequest.post(`/conversations`, {
            to: sellerId,
          });
          navigate(`/message/${res.data.id}`);
        } catch (postErr) {
          alert(`POST failed: 500 - ${postErr.response?.data?.message || postErr.message}`);
        }
      } else {
        alert(`GET failed: ${err.response ? err.response.status : err.message} - ${err.response?.data?.message || ""}`);
      }
    }
  };

  const handleWhatsApp = () => {
    const phoneNumber = user.phone || "1234567890"; // Fallback
    const message = encodeURIComponent(`Hi ${user.username}, I'm interested in your service: ${service.title}`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const catMapping = {
    "graphics": "Graphics & Design",
    "programming": "Programming & Tech",
    "web-design": "Web Design",
    "wordpress": "WordPress",
    "video": "Video & Animation",
    "writing": "Writing & Translation",
    "ai": "AI Services",
    "marketing": "Digital Marketing",
    "music": "Music & Audio",
    "data-science": "Data Science",
    "business": "Business Consulting",
    "lifestyle": "Lifestyle",
    "photography": "Photography"
  };

  return (
    <div className="service">
      <div className="service-content">

        {/* ── Box 1: Hero / Image ─────────────────────────────── */}
        <div className="service-hero-card">
          <span className="breadcrumbs">
            UniServe &gt; {catMapping[service.cat] || (service.cat ? service.cat.charAt(0).toUpperCase() + service.cat.slice(1) : "")} &gt;
          </span>
          <h1>{service.title}</h1>
          <div className="user-row">
            <img
              className="pp"
              src={user.img || profileDefault}
              alt=""
            />
            <span>{user.username}</span>
            <div className="stars">
              <Star size={14} fill="gold" color="gold" />
              <span>
                {!isNaN(service.totalStars / service.starNumber) &&
                  Math.round(service.totalStars / service.starNumber)}
              </span>
            </div>
          </div>
          <div className="image-slider">
            <div className="main-image">
              <img src={selectedImage || service.cover} alt="" />
            </div>
            {service.images?.length > 0 && (
              <div className="thumbnails">
                <img 
                  src={service.cover} 
                  alt="" 
                  className={selectedImage === service.cover ? "active" : ""} 
                  onClick={() => setSelectedImage(service.cover)}
                />
                {service.images.map((img, i) => (
                  <img 
                    key={i} 
                    src={img} 
                    alt="" 
                    className={selectedImage === img ? "active" : ""} 
                    onClick={() => setSelectedImage(img)}
                  />
                ))}
              </div>
            )}
          </div>
          <h2>About This Service</h2>
          <p>{service.desc}</p>
        </div>

        {/* ── Box 2: Pricing / Details ────────────────────────── */}
        <div className="service-pricing-card">
          <div className="price">
            <h3>{service.shortTitle}</h3>
            <h2>₹ {service.price}</h2>
          </div>
          <p>{service.shortDesc}</p>
          <div className="details">
            <div className="item">
              <span>{service.deliveryTime} Days Delivery</span>
            </div>
            <div className="item">
              <span>{service.revisionNumber} Revisions</span>
            </div>
          </div>
          <div className="pricing-features">
            {service.features?.map((feature) => (
              <div className="item" key={feature}>
                <Check color="green" size={16} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <button 
            className={`purchase-btn ${currentUser && service.userId === currentUser._id ? "disabled" : ""}`} 
            onClick={handlePurchase}
            disabled={currentUser && service.userId === currentUser._id}
          >
            {currentUser && service.userId === currentUser._id ? "Own Service" : "Continue"}
          </button>
        </div>

        {/* ── Box 3: About The Seller ─────────────────────────── */}
        <div className="service-seller-card">
          <h2>About The Seller</h2>
          <div className="seller-user">
            <img
              src={user.img || profileDefault}
              alt=""
            />
            <div className="seller-info">
              <span className="seller-name">{user.username}</span>
              <div className="stars">
                <Star size={14} fill="gold" color="gold" />
                <span>
                  {!isNaN(service.totalStars / service.starNumber) &&
                    Math.round(service.totalStars / service.starNumber)}
                </span>
              </div>
              <div className="seller-buttons">
                <button 
                  className={`contact-btn ${currentUser && user._id === currentUser._id ? "disabled" : ""}`}
                  onClick={handleContact}
                  disabled={currentUser && user._id === currentUser._id}
                >
                  {currentUser && user._id === currentUser._id ? "You" : "Contact Me"}
                </button>
                <button className="whatsapp-btn" onClick={handleWhatsApp}>
                  <MessageCircle size={16} /> WhatsApp Chat
                </button>
              </div>
            </div>
          </div>
          <div className="seller-details">
            <div className="seller-grid">
              <div className="detail-item">
                <span className="label">From</span>
                <span className="value">{user.country}</span>
              </div>
              <div className="detail-item">
                <span className="label">Member since</span>
                <span className="value">Jan 2026</span>
              </div>
              <div className="detail-item">
                <span className="label">Avg. response time</span>
                <span className="value">4 hours</span>
              </div>
              <div className="detail-item">
                <span className="label">Last delivery</span>
                <span className="value">1 day</span>
              </div>
              <div className="detail-item">
                <span className="label">Languages</span>
                <span className="value">English</span>
              </div>
            </div>
            <hr />
            <p>{user.desc}</p>
          </div>
        </div>

        {/* ── Box 4: Reviews ──────────────────────────────────── */}
        <div className="service-reviews-card">
          <h2>Reviews</h2>
          {reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet for this service.</p>
          ) : (
            reviews.map((review) => (
              <Review key={review._id} review={review} onUpdate={fetchReviews} />
            ))
          )}
          {pendingOrders.length > 0 && (
            <div className="review-add-container">
              <h3>Add a review</h3>
              <p className="order-hint">Leaving a review for order: {pendingOrders[0]._id}</p>
              <form action="" className="addForm" onSubmit={handleSubmitReview}>
                <input type="text" placeholder="write your opinion" required />
                <select name="" id="">
                  <option value={5}>5 (Excellent)</option>
                  <option value={4}>4 (Good)</option>
                  <option value={3}>3 (Average)</option>
                  <option value={2}>2 (Fair)</option>
                  <option value={1}>1 (Poor)</option>
                </select>
                <button>Send Review</button>
              </form>
              {error && <span className="error">{error}</span>}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Service;
