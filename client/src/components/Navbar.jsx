import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, X, Menu } from "lucide-react";
import moment from "moment";
import "./Navbar.css";
import newRequest from "../utils/newRequest";
import { profileDefault } from "../utils/constants";

function Navbar() {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { pathname } = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = () => {
    window.scrollY > 0 ? setActive(true) : setActive(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", isActive);
    return () => {
      window.removeEventListener("scroll", isActive);
    };
  }, []);

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("currentUser");
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      return null;
    }
  })();

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await newRequest.get("/users/notifications");
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Polling for new notifications
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await newRequest.patch(`/users/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadAll = async () => {
    try {
      await newRequest.patch("/users/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await newRequest.delete("/users/notifications/clear-all");
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await newRequest.delete(`/users/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      const deletedWasUnread = notifications.find(n => n._id === id && !n.isRead);
      if (deletedWasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await newRequest.post("/auth/logout");
      localStorage.setItem("currentUser", null);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className={(active || pathname !== "/") ? "navbar active" : "navbar"}>
      <div className="container">
        <div className="logo">
          <Link className="link" to="/">
            <img src="/images/logo.png" alt="UniServe Logo" height="40" />
            <span className="text">UniServe</span>
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="links">
          <Link to="/business-talent" className="link">UniServe Business</Link>
          <Link to="/services" className="link">Explore</Link>
          {!currentUser?.isVendor && (
            <Link to={currentUser ? "/add" : "/register"} className="link">
              Become a Seller
            </Link>
          )}
          {currentUser ? (
            <div className="user-nav-actions" style={{display: "flex", alignItems: "center", gap: "20px"}}>
              <div className="notifications-container" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={24} color={active || pathname !== "/" ? "#404040" : "white"} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
                {showNotifications && (
                  <div className="notifications-dropdown" onClick={(e) => e.stopPropagation()}>
                    <div className="dropdown-header">
                      <span>Notifications</span>
                      <div className="dropdown-actions">
                        <button onClick={handleReadAll} className="btn-read-all">Mark all as read</button>
                        <button onClick={handleClearAll} className="btn-clear-all">Clear all</button>
                      </div>
                    </div>
                    <div className="notifications-list">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div
                          key={n._id}
                          className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                          onClick={() => {
                            if (n.link) navigate(n.link);
                            handleMarkAsRead(n._id);
                            setShowNotifications(false);
                          }}
                        >
                          <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px"}}>
                            <p>{n.message}</p>
                            <button
                              className="delete-notification-btn"
                              onClick={(e) => handleDeleteNotification(e, n._id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#94a3b8",
                                cursor: "pointer",
                                padding: "2px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "4px",
                                transition: "all 0.2s"
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <small>{moment(n.createdAt).fromNow()}</small>
                        </div>
                      )) : (
                        <div className="no-notifications">No notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="user" onClick={() => setOpen(!open)}>
                <img
                  src={currentUser.img || profileDefault}
                  alt=""
                  onError={(e) => { e.target.onerror = null; e.target.src = profileDefault; }}
                />
                <span>{currentUser?.username}</span>
                {open && (
                  <div className="options">
                    <Link className="link" to="/dashboard">Dashboard</Link>
                    {(currentUser.role === "student" || currentUser.role === "hr" || currentUser.role === "po") && (currentUser.subscription === "premium" || currentUser.subscription === "business") && (
                      <Link className="link" to="/career-ai">Career AI</Link>
                    )}
                    {currentUser.role === "student" && currentUser.subscription === "business" && (
                      <>
                        <Link className="link" to="/placements">Placements</Link>
                        <Link className="link" to="/job-board">Job Board</Link>
                        <Link className="link" to="/my-applications">My Applications</Link>
                      </>
                    )}
                    {currentUser.role === "hr" && currentUser.hrVerification?.status === "approved" && (
                      <>
                        <Link className="link" to="/hr-search">Find Talent</Link>
                        <Link className="link" to="/hr-outreach">Outreach Center</Link>
                        <Link className="link" to="/manage-jobs">Manage Jobs</Link>
                        <Link className="link" to="/hr-proposals">Proposals</Link>
                      </>
                    )}
                    {currentUser.role === "po" && (
                      <>
                        <Link className="link" to="/job-board">Job Board</Link>
                        <Link className="link" to="/po-outreach">Outreach Center</Link>
                      </>
                    )}
                    <Link className="link" to="/profile">Profile</Link>
                    <Link className="link" to="/wishlist">Wishlist</Link>
                    <Link className="link" to="/subscription">Subscriptions</Link>
                    {currentUser.isVendor && (
                      <>
                        <Link className="link" to="/my-services">Services</Link>
                        <Link className="link" to="/add">Add New Service</Link>
                      </>
                    )}
                    <Link className="link" to="/orders">Orders</Link>
                    <Link className="link" to="/messages">Messages</Link>
                    <Link className="link" onClick={handleLogout}>Logout</Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="link">Sign in</Link>
              <Link className="link" to="/register">
                <button className="join-btn">Join</button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Top-Bar Actions */}
        <div className="mobile-actions">
          {currentUser && (
            <div className="notifications-container" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell size={22} color={active || pathname !== "/" ? "#404040" : "white"} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
              {showNotifications && (
                <div className="notifications-dropdown mobile-notif-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="dropdown-header">
                    <span>Notifications</span>
                    <div className="dropdown-actions">
                      <button onClick={handleReadAll} className="btn-read-all">Mark all read</button>
                      <button onClick={handleClearAll} className="btn-clear-all">Clear all</button>
                    </div>
                  </div>
                  <div className="notifications-list">
                    {notifications.length > 0 ? notifications.map(n => (
                      <div
                        key={n._id}
                        className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                        onClick={() => {
                          if (n.link) navigate(n.link);
                          handleMarkAsRead(n._id);
                          setShowNotifications(false);
                        }}
                      >
                        <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px"}}>
                          <p>{n.message}</p>
                          <button
                            className="delete-notification-btn"
                            onClick={(e) => handleDeleteNotification(e, n._id)}
                            style={{
                              background: "none", border: "none", color: "#94a3b8",
                              cursor: "pointer", padding: "2px", display: "flex",
                              alignItems: "center", borderRadius: "4px", transition: "all 0.2s"
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <small>{moment(n.createdAt).fromNow()}</small>
                      </div>
                    )) : (
                      <div className="no-notifications">No notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen
              ? <X size={24} />
              : <Menu size={24} />
            }
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-menu-backdrop" onClick={closeMobileMenu} />
          <div className="mobile-menu">
            {currentUser ? (
              <>
                <div className="mobile-menu-user-header">
                  <img
                    src={currentUser.img || profileDefault}
                    alt=""
                    onError={(e) => { e.target.onerror = null; e.target.src = profileDefault; }}
                  />
                  <div>
                    <span className="mobile-menu-username">{currentUser.username}</span>
                    <span className="mobile-menu-role">{currentUser.role}</span>
                  </div>
                </div>
                <div className="mobile-menu-divider" />
              </>
            ) : null}

            <Link to="/business-talent" className="mobile-menu-link" onClick={closeMobileMenu}>UniServe Business</Link>
            <Link to="/services" className="mobile-menu-link" onClick={closeMobileMenu}>Explore</Link>
            {!currentUser?.isVendor && (
              <Link to={currentUser ? "/add" : "/register"} className="mobile-menu-link" onClick={closeMobileMenu}>
                Become a Seller
              </Link>
            )}

            {currentUser ? (
              <>
                <div className="mobile-menu-divider" />
                <Link to="/dashboard" className="mobile-menu-link" onClick={closeMobileMenu}>Dashboard</Link>
                {(currentUser.role === "student" || currentUser.role === "hr" || currentUser.role === "po") && (currentUser.subscription === "premium" || currentUser.subscription === "business") && (
                  <Link to="/career-ai" className="mobile-menu-link" onClick={closeMobileMenu}>Career AI</Link>
                )}
                {currentUser.role === "student" && currentUser.subscription === "business" && (
                  <>
                    <Link to="/placements" className="mobile-menu-link" onClick={closeMobileMenu}>Placements</Link>
                    <Link to="/job-board" className="mobile-menu-link" onClick={closeMobileMenu}>Job Board</Link>
                    <Link to="/my-applications" className="mobile-menu-link" onClick={closeMobileMenu}>My Applications</Link>
                  </>
                )}
                {currentUser.role === "hr" && currentUser.hrVerification?.status === "approved" && (
                  <>
                    <Link to="/hr-search" className="mobile-menu-link" onClick={closeMobileMenu}>Find Talent</Link>
                    <Link to="/hr-outreach" className="mobile-menu-link" onClick={closeMobileMenu}>Outreach Center</Link>
                    <Link to="/manage-jobs" className="mobile-menu-link" onClick={closeMobileMenu}>Manage Jobs</Link>
                    <Link to="/hr-proposals" className="mobile-menu-link" onClick={closeMobileMenu}>Proposals</Link>
                  </>
                )}
                {currentUser.role === "po" && (
                  <>
                    <Link to="/job-board" className="mobile-menu-link" onClick={closeMobileMenu}>Job Board</Link>
                    <Link to="/po-outreach" className="mobile-menu-link" onClick={closeMobileMenu}>Outreach Center</Link>
                  </>
                )}
                <div className="mobile-menu-divider" />
                <Link to="/profile" className="mobile-menu-link" onClick={closeMobileMenu}>Profile</Link>
                <Link to="/wishlist" className="mobile-menu-link" onClick={closeMobileMenu}>Wishlist</Link>
                <Link to="/subscription" className="mobile-menu-link" onClick={closeMobileMenu}>Subscriptions</Link>
                {currentUser.isVendor && (
                  <>
                    <Link to="/my-services" className="mobile-menu-link" onClick={closeMobileMenu}>My Services</Link>
                    <Link to="/add" className="mobile-menu-link" onClick={closeMobileMenu}>Add New Service</Link>
                  </>
                )}
                <Link to="/orders" className="mobile-menu-link" onClick={closeMobileMenu}>Orders</Link>
                <Link to="/messages" className="mobile-menu-link" onClick={closeMobileMenu}>Messages</Link>
                <div className="mobile-menu-divider" />
                <button
                  className="mobile-menu-link mobile-logout-btn"
                  onClick={() => { handleLogout(); closeMobileMenu(); }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="mobile-menu-divider" />
                <Link to="/login" className="mobile-menu-link" onClick={closeMobileMenu}>Sign In</Link>
                <Link to="/register" className="mobile-menu-link mobile-join-link" onClick={closeMobileMenu}>
                  Join UniServe
                </Link>
              </>
            )}
          </div>
        </>
      )}

      {/* Category Bar */}
      {(active || pathname !== "/") && (
        <>
          <hr />
          <div className="menu container">
            <Link className="link menuLink" to="/services?cat=graphics">Graphics</Link>
            <Link className="link menuLink" to="/services?cat=video">Video & Animation</Link>
            <Link className="link menuLink" to="/services?cat=writing">Writing & Translation</Link>
            <Link className="link menuLink" to="/services?cat=ai">AI Services</Link>
            <Link className="link menuLink" to="/services?cat=marketing">Digital Marketing</Link>
            <Link className="link menuLink" to="/services?cat=music">Music & Audio</Link>
            <Link className="link menuLink" to="/services?cat=programming">Programming & Tech</Link>
          </div>
          <hr />
        </>
      )}
    </div>
  );
}

export default Navbar;
