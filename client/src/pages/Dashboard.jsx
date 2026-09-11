import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import "./Dashboard.css";
import newRequest from "../utils/newRequest";
import { profileDefault } from "../utils/constants";
import { 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  TrendingUp, 
  IndianRupee, 
  Briefcase,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  FileText,
  Rocket,
  Ticket,
  Copy,
  Check,
  X
} from "lucide-react";
import CareerAI from "../components/CareerAI";
import PlacementSupport from "../components/PlacementSupport";
import HRDashboard from "../components/HRDashboard";
import PODashboard from "../components/PODashboard";
import AdminDashboard from "../components/AdminDashboard";
import AdminVerificationHub from "../components/AdminVerificationHub";
import InstitutionalUpdate from "../components/InstitutionalUpdate";
import SuspensionBanner from "../components/SuspensionBanner";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      return storedUser ? JSON.parse(storedUser) : {};
    } catch (err) {
      return {};
    }
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = useState("personal"); // "personal" or "professional"
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [pendingServices, setPendingServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [userCoupons, setUserCoupons] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [subRequests, setSubRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [pendingProfileUpdates, setPendingProfileUpdates] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showDisputeDetails, setShowDisputeDetails] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [refundPercentage, setRefundPercentage] = useState(0);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activating, setActivating] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalServices: 0,
    pendingApprovals: 0,
    totalOrders: 0,
    totalEarnings: 0,
    activeMessages: 0
  });

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  const renderCouponsModal = () => {
    // We now use userCoupons from the backend which includes gifted and tier-based coupons
    // We still keep the legacy logic for Tier Exclusive if they are not yet in the DB
    const legacyTierCoupons = [];
    if (user.subscription === "premium" && !userCoupons.some(c => c.code === "PREMIUM10")) {
      legacyTierCoupons.push({ code: "PREMIUM10", discount: 10, desc: "Tier Exclusive Discount" });
    } else if (user.subscription === "business" && !userCoupons.some(c => c.code === "BUSINESS20")) {
      legacyTierCoupons.push({ code: "BUSINESS20", discount: 20, desc: "Tier Exclusive Discount" });
    }

    const allMyCoupons = [...userCoupons, ...legacyTierCoupons];

    return (
      <div className="sub-modal-overlay coupons-modal-overlay">
        <div className="sub-modal-content coupons-modal">
          <button className="close-btn" onClick={() => setShowCouponsModal(false)}>
            <XCircle size={24} />
          </button>
          <div className="modal-header">
            <Ticket size={28} className="header-icon" />
            <h2>My Exclusive Coupons</h2>
            <p>Use these codes at checkout to save on your orders!</p>
          </div>
          <div className="coupons-list">
            {allMyCoupons.length > 0 ? allMyCoupons.map((c, i) => (
              <div key={i} className="coupon-item-card">
                <div className="coupon-info">
                  <div className="discount-badge">{c.discount}{c.isPercentage !== false ? "%" : ""} OFF</div>
                  <div className="coupon-details">
                    <span className="coupon-code">{c.code}</span>
                    <span className="coupon-desc">{c.desc || (c.minSubscription && c.minSubscription !== "normal" ? `${c.minSubscription.toUpperCase()} Exclusive` : "Special Offer")}</span>
                  </div>
                </div>
                <button 
                  className={`copy-btn ${copiedCode === c.code ? "copied" : ""}`}
                  onClick={() => handleCopyCode(c.code)}
                >
                  {copiedCode === c.code ? <Check size={18} /> : <Copy size={18} />}
                  {copiedCode === c.code ? "Copied" : "Copy"}
                </button>
              </div>
            )) : (
              <div className="no-coupons">
                <Ticket size={48} />
                <p>No active coupons found for your account.</p>
                {user.subscription === "normal" && (
                  <button className="upgrade-link" onClick={() => navigate("/subscription")}>
                    Upgrade to get Tier Discounts
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleActivateSeller = async () => {
    setActivating(true);
    try {
      const res = await newRequest.post("/users/activate-seller");
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to activate seller account.");
    } finally {
      setActivating(false);
      setShowActivationModal(false);
    }
  };

  const fetchData = async () => {
    try {
      // Sync user data to ensure latest subscription status and resume data
      const userRes = await newRequest.get("/users/me");
      const updatedUser = userRes.data;
      setUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      
      const servicesRes = await newRequest.get(updatedUser.isVendor ? `/services?userId=${updatedUser._id}` : "/services");
      const ordersRes = await newRequest.get(updatedUser.isAdmin ? "/orders/all" : "/orders");
      const convRes = await newRequest.get("/conversations");
      
      // Fetch user's "My Coupons" (for use) - accessible to all
      const userCouponsRes = await newRequest.get("/coupons/user");
      setUserCoupons(userCouponsRes.data);

      let users = [];
      let currentServices = servicesRes.data;
      let currentOrders = ordersRes.data;
      let currentPending = [];

      if (updatedUser.isAdmin) {
        const allUsersRes = await newRequest.get("/users");
        users = allUsersRes.data;
        setUsers(users);
        const allServicesRes = await newRequest.get("/services");
        currentServices = allServicesRes.data;
        setServices(currentServices);
        const pendingRes = await newRequest.get("/services/pending");
        currentPending = pendingRes.data;
        setPendingServices(currentPending);
        const couponsRes = await newRequest.get("/coupons");
        setCoupons(couponsRes.data);
        const subRequestsRes = await newRequest.get("/users/upgrade/requests");
        setSubRequests(subRequestsRes.data);
        const allJobsRes = await newRequest.get("/jobs");
        setJobs(allJobsRes.data);
        const reportsRes = await newRequest.get("/reports/admin");
        setReports(reportsRes.data);
        const updatesRes = await newRequest.get("/users/profile-update-requests");
        setPendingProfileUpdates(updatesRes.data || []);
        const pendingCouponsRes = await newRequest.get("/coupons/pending");
        setOrders(currentOrders);
        
        setStats({
          totalUsers: users.length, 
          totalServices: currentServices.length,
          pendingApprovals: currentPending.length,
          totalOrders: currentOrders.length,
          totalEarnings: 0,
          activeMessages: convRes.data.length,
          pendingAppeals: users.filter(u => u.appealStatus === "pending").length,
          pendingReports: reportsRes.data.filter(r => r.status === "pending").length,
          pendingCoupons: pendingCouponsRes.data.length,
          pendingSubscriptions: subRequestsRes.data.length,
          totalDisputes: currentOrders.filter(o => o.paymentStatus === "disputed").length,
          refundDisputes: currentOrders.filter(o => o.dispute?.refundStatus === "refund_disputed").length,
          pendingVerifications: users.filter(u => 
            u.hrVerification?.status === "pending" || 
            u.poVerification?.status === "pending" || 
            u.studentVerification?.status === "pending" ||
            u.profileUpdateRequests?.some(r => r.status === "pending")
          ).length
        });
      } else if (updatedUser.isVendor) {
        setServices(currentServices);
        setOrders(currentOrders);
        // Fetch "Coupons & Offers" (Vendor Hub) - created by this vendor
        const myCouponsRes = await newRequest.get("/coupons/my");
        setCoupons(myCouponsRes.data);
        
        setStats({
          totalUsers: 0, 
          totalServices: currentServices.length,
          pendingApprovals: 0,
          totalOrders: currentOrders.length,
          totalEarnings: currentServices.reduce((acc, curr) => acc + (curr.sales * curr.price), 0),
          activeMessages: convRes.data.length,
          pendingAppeals: 0,
          pendingCoupons: 0,
          totalDisputes: 0
        });
      } else {
        setServices(currentServices);
        setOrders(currentOrders);
        
        setStats({
          totalUsers: 0, 
          totalServices: currentServices.length,
          pendingApprovals: 0,
          totalOrders: currentOrders.length,
          totalEarnings: 0,
          activeMessages: convRes.data.length,
          pendingAppeals: 0,
          pendingCoupons: 0,
          totalDisputes: 0
        });
      }

      // Populate Recent Activities
      const acts = [];
      
      // Add Orders to activities
      currentOrders.forEach(o => {
        acts.push({
          id: o._id,
          type: "order",
          text: user.isAdmin ? `New Platform Order: ₹${o.price}` :
                user.isVendor && o.vendorId === user._id ? `New sale: ${o.title}` :
                `Order placed for ${o.title}`,
          time: o.createdAt
        });
      });

      // Add Services to activities
      currentServices.forEach(s => {
        if (user.isAdmin) {
          acts.push({
            id: s._id,
            type: "service",
            text: `New Service: ${s.title}`,
            time: s.createdAt
          });
        } else if (s.userId === user._id && !s.isApproved) {
          acts.push({
            id: s._id,
            type: "service",
            text: `Service "${s.title.slice(0, 15)}..." is pending approval`,
            time: s.createdAt
          });
        }
      });

      // Add Conversations to activities
      convRes.data.forEach(c => {
        acts.push({
          id: c.id,
          type: "message",
          text: `Update in conversation with ${user.isVendor ? "buyer" : "seller"}`,
          time: c.updatedAt
        });
      });

      // Add new users for Admin
      if (user.isAdmin) {
        users.forEach(u => {
          acts.push({
            id: u._id,
            type: "user",
            text: `New user: ${u.username}`,
            time: u.createdAt
          });
        });
      }

      // Sort and set activities
      const sortedActivities = acts
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5);
      
      setActivities(sortedActivities);

    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this user and all their data? This action cannot be undone.")) return;
    try {
      await newRequest.delete(`/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("Are you sure you want to permanently remove this service from the marketplace?")) return;
    try {
      await newRequest.delete(`/services/${id}`);
      setServices(services.filter((s) => s._id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleResolveDispute = async (id, status, refundPercent = 0) => {
    try {
      await newRequest.patch(`/orders/admin/resolve/${id}`, { 
        status, 
        refundPercentage: Number(refundPercent) 
      });
      fetchData();
      setShowDisputeDetails(false);
      setRefundPercentage(0); // Reset for next use
    } catch (err) {
      console.log(err);
      alert("Resolution failed: " + (err.response?.data || err.message));
    }
  };

  const handleApproveService = async (id) => {
    try {
      await newRequest.patch(`/services/approve/${id}`);
      fetchData();
    } catch (err) {
      console.log(err);
    }
  };

  const handleBanUser = async (id) => {
    try {
      const res = await newRequest.put(`/users/ban/${id}`);
      fetchData();
    } catch (err) {
      console.log(err);
    }
  };

  const handleResolveAppeal = async (id, action) => {
    try {
      if (action === "unsuspend") {
        await newRequest.post("/admin-new/resolve-appeal", { userId: id, action: "unsuspend" });
        alert("Appeal approved. User account restored to normal.");
      } else if (action === "punishment") {
        const suspensionReason = window.prompt("Enter final suspension reason for the user:");
        const suspensionDuration = window.prompt("Enter suspension duration (e.g., 30 days):", "30 days");
        if (suspensionReason === null || suspensionDuration === null) return;
        
        await newRequest.post("/admin-new/resolve-appeal", { 
          userId: id, 
          action: "punishment",
          suspensionReason,
          suspensionDuration
        });
        alert("Punishment finalized. User will be notified of the reason.");
      }
      fetchData();
    } catch (err) {
      console.log(err);
      alert(err.response?.data || "Failed to resolve appeal");
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this order record?")) return;
    try {
      await newRequest.delete(`/orders/${id}`);
      setOrders(orders.filter(o => o._id !== id));
    } catch (err) {
      console.log(err);
    }
  };

  const handleApproveCoupon = async (id, action) => {
    try {
      await newRequest.patch(`/coupons/approve/${id}`, { action });
      alert(`Coupon ${action}d successfully.`);
      fetchData();
    } catch (err) {
      console.log(err);
      alert(err.response?.data || "Action failed.");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await newRequest.delete(`/coupons/${id}`);
      alert("Coupon deleted successfully.");
      fetchData();
    } catch (err) {
      console.log(err);
      const backendMessage = err.response?.data;
      const errorMessage = typeof backendMessage === "string" 
        ? backendMessage 
        : (backendMessage?.message || "Failed to delete coupon.");
      alert(errorMessage);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      code: formData.get("code"),
      discount: Number(formData.get("discount")),
      isPercentage: formData.get("isPercentage") === "true",
      expiryDate: formData.get("expiryDate"),
      targetUsername: formData.get("targetUsername") || null,
      minSubscription: formData.get("minSubscription") || "normal"
    };

    try {
      const res = await newRequest.post("/coupons", payload);
      alert(user.isAdmin ? "Coupon created successfully." : "Coupon request submitted to admin.");
      e.target.reset();
      fetchData();
    } catch (err) {
      console.error("Coupon creation error object:", err);
      const backendMessage = err.response?.data;
      const errorMessage = typeof backendMessage === "string" 
        ? backendMessage 
        : (backendMessage?.message || "Failed to create coupon. Please try again with a different code.");
      alert(errorMessage);
    }
  };

  const handleResolveRefundDispute = async (id, action) => {
    try {
      if (action === "approve") {
        await newRequest.patch(`/orders/refund/confirm/${id}`);
        alert("Refund dispute approved. Order closed and restriction lifted.");
      } else {
        // Just move it back to pending_vendor so vendor has to try again or contact support
        await newRequest.patch(`/orders/admin/reject-refund-dispute/${id}`);
        alert("Refund dispute rejected. Vendor must provide valid proof.");
      }
      fetchData();
    } catch (err) {
      console.log(err);
      alert("Action failed: " + (err.response?.data || err.message));
    }
  };

  const handleResolveReport = async (id, action) => {
    const adminNote = window.prompt("Enter admin note/reason for this resolution:");
    if (adminNote === null) return;
    try {
      await newRequest.put(`/reports/resolve/${id}`, { action, adminNote });
      alert("Report resolved and action taken.");
      fetchData();
    } catch (err) {
      console.log(err);
      alert("Failed to resolve report.");
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this dispute entry? This action cannot be undone.")) return;
    try {
      await newRequest.delete(`/reports/${id}`);
      alert("Dispute entry deleted.");
      fetchData();
    } catch (err) {
      console.log(err);
      alert("Failed to delete report entry.");
    }
  };

  const handleConfirmSubscription = async (id) => {
    try {
      await newRequest.put(`/users/upgrade/confirm/${id}`);
      alert("Subscription activated successfully!");
      fetchData();
    } catch (err) {
      console.log(err);
      alert("Failed to activate subscription.");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await newRequest.delete(`/jobs/${id}`);
      setJobs(jobs.filter(j => j._id !== id));
      alert("Job deleted successfully.");
    } catch (err) {
      alert("Failed to delete job.");
    }
  };

  const handleRejectSubscription = async (id) => {
    const reason = window.prompt("Enter rejection reason (optional):", "Payment not verified or documents invalid");
    if (reason === null) return; // Cancelled
    try {
      await newRequest.put(`/users/upgrade/reject/${id}`, { reason });
      alert("Subscription request rejected.");
      fetchData();
    } catch (err) {
      console.log(err);
      alert("Failed to reject request.");
    }
  };

  const renderCouponsTab = () => (
    <div className="admin-table-container">
      <div className="section-header">
        <h2>{user.isAdmin ? "Global & Vendor Promotions" : "Your Service Coupons"}</h2>
      </div>

      <div className="coupon-management-layout">
        <div className="coupon-form-card">
          <h3>{user.isAdmin ? "Create Global Coupon" : "Request New Coupon"}</h3>
          <form onSubmit={handleCreateCoupon} className="dashboard-form">
            <input type="text" name="code" placeholder="Coupon Code (e.g. SUMMER50)" required />
            <div className="form-row">
              <input type="number" name="discount" placeholder="Discount Value" required />
              <select name="isPercentage">
                <option value="true">% Discount</option>
                <option value="false">Fixed Amount (₹)</option>
              </select>
            </div>
            <label>Expiry Date</label>
            <input type="date" name="expiryDate" required min={new Date().toISOString().split("T")[0]} />
            
            {user.isAdmin && (
              <>
                <div className="form-group">
                  <label>Gift to Specific User (Optional)</label>
                  <input type="text" name="targetUsername" placeholder="Enter Username" />
                  <small className="form-hint">User must have an active account</small>
                </div>
                <div className="form-group">
                  <label>Tier Restriction</label>
                  <select name="minSubscription">
                    <option value="normal">All Users (Normal)</option>
                    <option value="premium">Premium Only</option>
                    <option value="business">Business Only</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="action-btn emerald">
              {user.isAdmin ? "Create & Activate" : "Submit for Approval"}
            </button>
          </form>
        </div>

        <div className="coupon-list-card">
          <h3>Existing Coupons</h3>
          {coupons.length === 0 ? (
            <p className="empty-msg">No coupons found.</p>
          ) : (
            <div className="coupon-scroll-list">
              {coupons.map((c) => (
                <div key={c._id} className={`coupon-item-card ${c.status}`}>
                  <div className="coupon-main">
                    <span className="code">{c.code}</span>
                    <span className="benefit">{c.isPercentage ? `${c.discount}% OFF` : `₹${c.discount} OFF`}</span>
                  </div>
                  <div className="coupon-meta">
                    <span>Expires: {moment(c.expiryDate).format("MMM DD, YYYY")}</span>
                    <span className={`status-pill ${c.status}`}>{c.status}</span>
                    {c.minSubscription && c.minSubscription !== "normal" && (
                      <span className={`tier-pill ${c.minSubscription}`}>{c.minSubscription.toUpperCase()}</span>
                    )}
                    {c.targetUserId && (
                      <span className="user-specific-pill">
                        Exclusive: {user.isAdmin ? (users.find(u => u._id === c.targetUserId)?.username || "User") : "Gifted"}
                      </span>
                    )}
                    {user.isAdmin && c.vendorId && (
                       <small>Vendor: {users.find(u => u._id === c.vendorId)?.username || "Unknown"}</small>
                    )}
                    {!c.vendorId && user.isAdmin && <small className="global-tag">Global</small>}
                  </div>
                  <div className="approve-actions">
                    {user.isAdmin && c.status === "pending" && (
                      <>
                        <button className="action-btn-sm approve" onClick={() => handleApproveCoupon(c._id, "approve")}>Approve</button>
                        <button className="action-btn-sm delete" onClick={() => handleApproveCoupon(c._id, "reject")}>Reject</button>
                      </>
                    )}
                    {(user.isAdmin || (user.isVendor && c.vendorId === user._id)) && (
                      <button className="action-btn-sm delete" onClick={() => handleDeleteCoupon(c._id)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSubscriptionsTab = () => (
    <div className="admin-table-container">
      <div className="section-header">
        <h2>Subscription Upgrade Requests</h2>
      </div>

      <div className="admin-scroll-table">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Plan</th>
              <th>Verification</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {subRequests.length === 0 ? (
              <tr><td colSpan="7" className="empty-row">No pending subscription requests</td></tr>
            ) : (
              subRequests.map((req) => (
                <tr key={req._id}>
                  <td>{users.find(u => u._id === req.userId)?.username || "User ID: " + req.userId}</td>
                  <td className="plan-name-cell">{req.plan.toUpperCase()}</td>
                  <td>
                    <div className="verification-links">
                      {req.collegeId ? (
                        <a href={req.collegeId} target="_blank" rel="noreferrer" className="doc-link">View ID</a>
                      ) : <span className="no-doc">No ID</span>}
                      {req.transcripts && req.transcripts.length > 0 && (
                        <div className="transcripts-dropdown">
                          <span className="doc-link">Transcripts ({req.transcripts.length})</span>
                          <div className="dropdown-content">
                            {req.transcripts.map((t, idx) => (
                              <a key={idx} href={t} target="_blank" rel="noreferrer">Sem {idx+1}</a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="method-tag-cell">{req.paymentMethod.toUpperCase()}</td>
                  <td>₹{req.price}</td>
                  <td>{moment(req.createdAt).fromNow()}</td>
                  <td>
                    <div className="table-actions">
                      <button className="action-btn-sm approve" onClick={() => handleConfirmSubscription(req._id)}>Approve</button>
                      <button className="action-btn-sm delete" onClick={() => handleRejectSubscription(req._id)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVendorDashboard = () => (
    <div className="dashboard-content">
      {activeTab === "overview" && (
        <>
          <div className="dashboard-grid">
            <div className="stat-card accent">
              <div className="icon-wrapper"><IndianRupee size={24} /></div>
              <div className="info">
                <h3>Gross Earnings</h3>
                <span>₹{stats.totalEarnings}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="icon-wrapper"><Briefcase size={24} /></div>
              <div className="info">
                <h3>Active Services</h3>
                <span>{stats.totalServices}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="icon-wrapper"><TrendingUp size={24} /></div>
              <div className="info">
                <h3>Total Sales</h3>
                <span>{stats.totalOrders}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="icon-wrapper"><MessageSquare size={24} /></div>
              <div className="info">
                <h3>Inquiries</h3>
                <span>{stats.activeMessages}</span>
              </div>
            </div>
            {(user.subscription === "premium" || user.subscription === "business") && (
              <div className="stat-card" onClick={() => setActiveTab("career")}>
                <div className="icon-wrapper"><FileText size={24} /></div>
                <div className="info">
                  <h3>ATS Score</h3>
                  <span>{user.resumeData?.atsScore || 0}</span>
                </div>
              </div>
            )}
            {user.subscription === "business" && (
              <div className="stat-card" onClick={() => setActiveTab("placement")}>
                <div className="icon-wrapper"><Rocket size={24} /></div>
                <div className="info">
                  <h3>Placement</h3>
                  <span>{user.isPlacementReady ? "ACTIVE" : "OFF"}</span>
                </div>
              </div>
            )}
          </div>
          <div className="vendor-tools">
            <div className="section-header">
              <h2>Provider Growth Hub</h2>
            </div>
            <div className="action-grid">
              <button className="action-btn emerald" onClick={() => navigate("/add")}>List New Service</button>
              <button className="action-btn" onClick={() => navigate("/my-services")}>Service Analytics</button>
              <button className="action-btn" onClick={() => navigate("/orders")}>Manage Sales</button>
              {(user.subscription === "premium" || user.subscription === "business") && (
                <button className="action-btn" onClick={() => setActiveTab("career")}>Resume Optimization</button>
              )}
              {user.subscription === "business" && (
                <button className="action-btn" onClick={() => setActiveTab("placement")}>Placement Support</button>
              )}
              <button className="action-btn" onClick={() => setActiveTab("coupons")}>Coupons & Offers</button>
              <button className="action-btn" onClick={() => navigate("/profile")}>Update Payments</button>
              {(user.subscription === "premium" || user.subscription === "business") && (
                <button className="action-btn highlight" onClick={() => setActiveTab("institutional")}>
                  Institutional Verification
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "career" && <CareerAI />}
      {activeTab === "placement" && <PlacementSupport />}
      {activeTab === "institutional" && <InstitutionalUpdate user={user} onUpdate={fetchData} />}
      {activeTab === "coupons" && renderCouponsTab()}
    </div>
  );

  const renderHRDashboard = () => (
    <div className="dashboard-content">
      <HRDashboard user={user} onShowCoupons={() => setShowCouponsModal(true)} />
    </div>
  );

  const renderPODashboard = () => (
    <div className="dashboard-content">
      <PODashboard user={user} onShowCoupons={() => setShowCouponsModal(true)} />
    </div>
  );

  const renderUserDashboard = () => (
    <div className="dashboard-content">
      {activeTab === "overview" && (
        <>
          <div className="dashboard-grid">
            {user.isVendor && (
              <>
                <div className="stat-card accent">
                  <div className="icon-wrapper"><IndianRupee size={24} /></div>
                  <div className="info">
                    <h3>Gross Earnings</h3>
                    <span>₹{stats.totalEarnings}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="icon-wrapper"><Briefcase size={24} /></div>
                  <div className="info">
                    <h3>Active Services</h3>
                    <span>{stats.totalServices}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="icon-wrapper"><TrendingUp size={24} /></div>
                  <div className="info">
                    <h3>Total Sales</h3>
                    <span>{stats.totalOrders}</span>
                  </div>
                </div>
              </>
            )}
            <div className="stat-card accent">
              <div className="icon-wrapper"><ShoppingBag size={24} /></div>
              <div className="info">
                <h3>Ongoing Orders</h3>
                <span>{stats.totalOrders}</span>
              </div>
            </div>
            {user.role === "student" && user.studentVerification?.status === "rejected" && (
              <div className="stat-card alert" onClick={() => navigate("/subscription")}>
                <div className="icon-wrapper"><XCircle size={24} /></div>
                <div className="info">
                  <h3>Sub. Rejected</h3>
                  <span>{user.studentVerification.rejectionReason?.slice(0, 15)}...</span>
                </div>
              </div>
            )}
            {/* Completion Prompt for new Premium/Business users */}
            {user.role === "student" && (user.subscription === "premium" || user.subscription === "business") && !user.university && (
              <div className="stat-card alert" onClick={() => navigate("/placements")}>
                <div className="icon-wrapper"><AlertTriangle size={24} /></div>
                <div className="info">
                  <h3>Complete Profile</h3>
                  <span>Action Required</span>
                </div>
              </div>
            )}
            <div className="stat-card">
              <div className="icon-wrapper"><MessageSquare size={24} /></div>
              <div className="info">
                <h3>Messages</h3>
                <span>{stats.activeMessages}</span>
              </div>
            </div>
            {(user.subscription === "premium" || user.subscription === "business") && (
              <div className="stat-card" onClick={() => setActiveTab("career")}>
                <div className="icon-wrapper"><FileText size={24} /></div>
                <div className="info">
                  <h3>ATS Score</h3>
                  <span>{user.resumeData?.atsScore || 0}</span>
                </div>
              </div>
            )}
            {user.role === "student" && user.subscription === "business" && (
              <div className="stat-card" onClick={() => setActiveTab("placement")}>
                <div className="icon-wrapper"><Rocket size={24} /></div>
                <div className="info">
                  <h3>Placement</h3>
                  <span>{user.isPlacementReady ? "ACTIVE" : "OFF"}</span>
                </div>
              </div>
            )}
          </div>
          <div className="user-actions">
            <div className="section-header">
              <h2>{(user.role === "hr" || user.role === "po") ? "Personal Buyer Center" : "Student & Buyer Center"}</h2>
            </div>
            <div className="action-grid">
              {user.isVendor && (
                <>
                  <button className="action-btn emerald" onClick={() => navigate("/add")}>List New Service</button>
                  <button className="action-btn" onClick={() => navigate("/my-services")}>Service Analytics</button>
                  <button className="action-btn" onClick={() => navigate("/orders")}>Manage Sales</button>
                  <button className="action-btn" onClick={() => setActiveTab("coupons")}>Coupons & Offers</button>
                </>
              )}
              <button className="action-btn emerald" onClick={() => navigate("/services")}>Explore Services</button>
              <button className="action-btn" onClick={() => navigate("/orders")}>Track Shipments</button>
              {(user.subscription === "premium" || user.subscription === "business") && (
                <button className="action-btn" onClick={() => setActiveTab("career")}>Resume Optimization</button>
              )}
              {user.role === "student" && user.subscription === "business" && (
                <>
                  <button className="action-btn" onClick={() => setActiveTab("placement")}>Placement Support</button>
                  <button className="action-btn navy" onClick={() => navigate("/job-board")}>Job Board</button>
                  <button className="action-btn emerald" onClick={() => navigate("/my-applications")}>My Applications</button>
                </>
              )}
              <button className="action-btn" onClick={() => navigate("/messages")}>Inbox</button>
              {!user.isVendor && (
                <button className="action-btn highlight" onClick={() => setShowActivationModal(true)}>Become a Seller</button>
              )}
              {user.role === "student" && (user.subscription === "premium" || user.subscription === "business") && (
                <button className="action-btn highlight" onClick={() => setActiveTab("institutional")}>
                  Institutional Verification
                </button>
              )}
              {user.isVendor && (
                 <button className="action-btn" onClick={() => navigate("/profile")}>Update Payments</button>
              )}
            </div>
          </div>
        </>
      )}
      {activeTab === "career" && <CareerAI />}
      {activeTab === "placement" && <PlacementSupport />}
      {activeTab === "institutional" && <InstitutionalUpdate user={user} onUpdate={fetchData} />}
      {showCouponsModal && renderCouponsModal()}
    </div>
  );

  const renderActivationModal = () => (
    <div className="sub-modal-overlay">
      <div className="sub-modal-content activation-modal">
        <div className="modal-header">
          <Rocket size={32} color="#10b981" />
          <h2>Activate Seller Account</h2>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to activate your Seller Account? This action is <strong>permanent</strong> and will unlock the Provider Growth Hub, allowing you to list services and manage sales.</p>
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={() => setShowActivationModal(false)} disabled={activating}>Cancel</button>
          <button className="confirm-btn action-btn emerald" onClick={handleActivateSeller} disabled={activating}>
            {activating ? "Activating..." : "Yes, Activate Now"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard">
      {showCouponsModal && renderCouponsModal()}
      {showActivationModal && renderActivationModal()}
      <div className="container">
        <div className="header">
          <h1>Welcome back, {user.username}!</h1>
          <p>
            {user.isAdmin 
              ? "Platform Administration Dashboard" 
              : user.role === "hr"
              ? (viewMode === "professional" ? "Corporate Recruitment Portal" : "Student & Buyer Center")
              : user.role === "po"
              ? (viewMode === "professional" ? "University Placement Portal" : "Student & Buyer Center")
              : user.isVendor 
              ? "Vendor Sales & Service Analytics" 
              : "Service Discovery & Career Growth"}
          </p>
          <div className="header-actions">
            {viewMode !== "professional" && (
              <button className="action-btn navy my-coupons-header-btn" onClick={() => setShowCouponsModal(true)}>
                <Ticket size={18} style={{ marginRight: '8px' }} /> My Coupons
              </button>
            )}
            {(user.role === "hr" || user.role === "po") && (
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${viewMode === "personal" ? "active" : ""}`}
                  onClick={() => setViewMode("personal")}
                >
                  Personal Dashboard
                </button>
                <button 
                  className={`toggle-btn ${viewMode === "professional" ? "active" : ""}`}
                  onClick={() => {
                    setViewMode("professional");
                    setActiveTab("overview");
                  }}
                >
                  {user.role === "hr" ? "HR Portal" : "Placement Portal"}
                </button>
              </div>
            )}
            {(activeTab !== "overview" && (user.role === "student" || user.isAdmin || user.isVendor || user.role === "hr" || user.role === "po")) && (
               <button className="back-btn" onClick={() => setActiveTab("overview")}>Back to Overview</button>
            )}
          </div>
        </div>

        {user.isAdmin 
          ? <AdminDashboard 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              stats={stats}
              users={users}
              reports={reports}
              services={services}
              pendingServices={pendingServices}
              orders={orders}
              jobs={jobs}
              subRequests={subRequests}
              pendingProfileUpdates={pendingProfileUpdates}
              renderSubscriptionsTab={renderSubscriptionsTab}
              renderCouponsTab={renderCouponsTab}
              handleResolveAppeal={handleResolveAppeal}
              handleResolveReport={handleResolveReport}
              handleDeleteReport={handleDeleteReport}
              handleDeleteUser={handleDeleteUser}
              handleBanUser={handleBanUser}
              handleApproveService={handleApproveService}
              handleDeleteService={handleDeleteService}
              handleResolveRefundDispute={handleResolveRefundDispute}
              handleDeleteOrder={handleDeleteOrder}
              handleDeleteJob={handleDeleteJob}
              setSelectedDispute={setSelectedDispute}
              setShowDisputeDetails={setShowDisputeDetails}
            />
          : user.role === "hr"
          ? (viewMode === "professional" ? renderHRDashboard() : renderUserDashboard())
          : user.role === "po"
          ? (viewMode === "professional" ? renderPODashboard() : renderUserDashboard())
          : user.isVendor 
          ? renderVendorDashboard() 
          : renderUserDashboard()}

        {activeTab === "overview" && viewMode !== "professional" && (
          <div className="recent-activity">
            <h2>Recent Activities</h2>
            <div className="activity-list">
              {activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id + act.time} className="activity-item">
                    <div className={`activity-icon type-${act.type}`}>
                      {act.type === "user" && <Users size={16} />}
                      {act.type === "service" && <Briefcase size={16} />}
                      {act.type === "order" && <ShoppingBag size={16} />}
                      {act.type === "message" && <MessageSquare size={16} />}
                    </div>
                    <div className="activity-details">
                      <p>{act.text}</p>
                      <small>{moment(act.time).fromNow()}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-msg">No recent activities to show.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Dashboard;
