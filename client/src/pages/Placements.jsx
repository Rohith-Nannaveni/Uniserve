import React, { useState, useEffect } from "react";
import "./Placements.css";
import newRequest from "../utils/newRequest";
import { UserCheck, ShieldCheck, Eye, Search, Briefcase, GraduationCap, Building2, CheckCircle, Clock, Edit, FileText, Upload, Plus, X, Building, MessageSquare, Lock, IndianRupee, AlertTriangle, RotateCcw, CheckCircle2, Send, Award, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Placements() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [proofs, setProofs] = useState([]); // Array of { url, label }
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "hrs", "branch", or "offers"
  const [hrs, setHrs] = useState([]);
  const [hrSearchQuery, setHrSearchQuery] = useState("");
  const [hrLoading, setHrLoading] = useState(false);
  const [myOffers, setMyOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [poExists, setPoExists] = useState(true);
  const [checkingPO, setCheckingPO] = useState(false);

  // Branch Request State
  const [branchFormData, setBranchFormData] = useState({
    requestedBranch: "",
    otherBranch: "",
    requestedSpecialization: "",
    proof: ""
  });
  const [submittingBranch, setSubmittingBranch] = useState(false);

  const branchOptions = [
    "Computer Science Engineering and related",
    "Electronics Communication Engineering and related",
    "Electrical Electronics Engineering and related",
    "Mechanical Engineering and related",
    "Civil Engineering and related",
    "Other"
  ];
  // PO removal notification state
  const [readdMessage, setReaddMessage] = useState("");
  const [showReaddInput, setShowReaddInput] = useState(false);
  const [respondingToRemoval, setRespondingToRemoval] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    university: "",
    graduationYear: "",
    desc: "",
    skills: "",
    resumeUrl: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (activeTab === "hrs") {
      fetchHRs();
    } else if (activeTab === "offers") {
      fetchOffers();
    } else if (activeTab === "branch") {
      checkPO();
    }
  }, [activeTab]);

  const checkPO = async () => {
    if (!user?.university) return;
    setCheckingPO(true);
    try {
      const res = await newRequest.get(`/users/check-po/${encodeURIComponent(user.university)}`);
      setPoExists(res.data.exists);
    } catch (err) {
      setPoExists(false);
    } finally {
      setCheckingPO(false);
    }
  };

  const fetchOffers = async () => {
    setOffersLoading(true);
    try {
      const res = await newRequest.get("/applications/my-offers");
      setMyOffers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleBranchProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { default: upload } = await import("../utils/upload");
      const url = await upload(file);
      setBranchFormData(prev => ({ ...prev, proof: url }));
      alert("Proof uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    if (!branchFormData.requestedBranch) {
      alert("Please select a branch.");
      return;
    }
    
    setSubmittingBranch(true);
    try {
      const payload = {
        requestedBranch: branchFormData.requestedBranch === "Other" ? branchFormData.otherBranch : branchFormData.requestedBranch,
        requestedSpecialization: branchFormData.requestedSpecialization,
        proof: branchFormData.proof
      };

      if (branchFormData.requestedBranch === "Other" && !branchFormData.otherBranch) {
        alert("Please specify your branch.");
        setSubmittingBranch(false);
        return;
      }

      await newRequest.post("/branch/submit", payload);
      alert("Branch change request submitted! Your Placement Officer will review it.");
      fetchUser();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setSubmittingBranch(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await newRequest.get("/users/me");
      setUser(res.data);
      setFormData({
        username: res.data.username || "",
        university: res.data.university || "",
        graduationYear: res.data.graduationYear || "2026",
        desc: res.data.desc || "",
        skills: res.data.resumeData?.parsedSkills?.join(", ") || "",
        resumeUrl: res.data.resumeData?.url || ""
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHRs = async (query = "") => {
    setHrLoading(true);
    try {
      const res = await newRequest.get(`/users/hrs${query ? `?companyName=${query}` : ""}`);
      setHrs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHrLoading(false);
    }
  };

  const handleHrSearch = (e) => {
    e.preventDefault();
    fetchHRs(hrSearchQuery);
  };

  const handleMessageHR = async (hrId) => {
    try {
      const res = await newRequest.post("/conversations", { to: hrId });
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to initiate conversation.");
    }
  };

  const handleToggleSearchable = async () => {
    setToggling(true);
    try {
      const res = await newRequest.patch("/career/placement-ready");
      setUser(prev => ({ ...prev, isPlacementReady: res.data.isPlacementReady }));
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setToggling(false);
    }
  };

  const handleRespondToRemoval = async (action) => {
    setRespondingToRemoval(true);
    try {
      const res = await newRequest.post("/career/po-removal-response", {
        action,
        message: action === "request_readd" ? readdMessage : ""
      });
      setUser(prev => ({ ...prev, poRemovalNotification: res.data.updatedNotification }));
      setShowReaddInput(false);
      setReaddMessage("");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to submit response.");
    } finally {
      setRespondingToRemoval(false);
    }
  };

  const handleFileUpload = async (e, type = "proof", label = "Supportive Document") => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { default: upload } = await import("../utils/upload");
      const url = await upload(file);
      if (type === "resume") {
        setFormData(prev => ({ ...prev, resumeUrl: url }));
      } else {
        setProofs(prev => {
          // If it's a singleton type (like ID or Resume via proof), replace existing
          if (label === "College ID") {
            return [...prev.filter(p => p.label !== "College ID"), { url, label }];
          }
          return [...prev, { url, label }];
        });
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const requestedChanges = {};
      if (formData.username !== user.username) requestedChanges.username = formData.username;
      if (formData.university !== user.university) requestedChanges.university = formData.university;
      if (Number(formData.graduationYear) !== user.graduationYear) requestedChanges.graduationYear = Number(formData.graduationYear);
      if (formData.desc !== user.desc) requestedChanges.desc = formData.desc;
      if (formData.resumeUrl && formData.resumeUrl !== (user.resumeData?.url || "")) {
        requestedChanges.resumeUrl = formData.resumeUrl;
      }
      
      const newSkills = formData.skills.split(",").map(s => s.trim()).filter(s => s);
      const oldSkills = user.resumeData?.parsedSkills || [];
      if (JSON.stringify(newSkills) !== JSON.stringify(oldSkills)) {
        requestedChanges.parsedSkills = newSkills;
      }

      if (Object.keys(requestedChanges).length === 0 && proofs.length === 0) {
        alert("No changes or proofs to submit.");
        setUpdateLoading(false);
        return;
      }

      // Convert requestedChanges object to Map format for the backend if needed, 
      // but usually axios sends object which Mongoose converts to Map.
      
      await newRequest.post("/users/profile-update-request", {
        requestedChanges,
        proofs
      });
      alert("Update request submitted! Admin will verify changes.");
      setShowUpdateModal(false);
      setProofs([]);
      fetchUser();
    } catch (err) {
      console.error(err);
      alert("Failed to submit update request.");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) return <div className="placements-loading">Loading placement dashboard...</div>;

  return (
    <div className="placements">
      <div className="container">
        <header className="placements-header">
          <h1><Briefcase size={32} color="#f1c40f" /> Placement <span>Support</span></h1>
          <p>Exclusive features for Business Tier students to get noticed by recruiters.</p>
        </header>

        <div className="placements-tabs">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} 
            onClick={() => setActiveTab('dashboard')}
          >
            <Edit size={18} /> My Dashboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'hrs' ? 'active' : ''}`} 
            onClick={() => setActiveTab('hrs')}
          >
            <Search size={18} /> Find Corporate Partners
          </button>
          <button 
            className={`tab-btn ${activeTab === 'branch' ? 'active' : ''}`} 
            onClick={() => setActiveTab('branch')}
          >
            <Building2 size={18} /> Branch Requests
          </button>
          <button 
            className={`tab-btn ${activeTab === 'offers' ? 'active' : ''}`} 
            onClick={() => setActiveTab('offers')}
          >
            <CheckCircle2 size={18} /> My Offers
          </button>
        </div>

        {activeTab === "dashboard" ? (
          <>
            {/* ── PO Removal Notification Banner ── */}
            {user?.poRemovalNotification?.isActive && (
              <div className={`po-removal-banner ${
                user.poRemovalNotification.studentResponse === "requested_readd" ? "pending" : "alert"
              }`}>
                <div className="removal-banner-icon">
                  {user.poRemovalNotification.studentResponse === "requested_readd"
                    ? <Clock size={28} color="#d97706" />
                    : <AlertTriangle size={28} color="#ef4444" />
                  }
                </div>
                <div className="removal-banner-body">
                  {user.poRemovalNotification.studentResponse === "requested_readd" ? (
                    <>
                      <h3>Re-addition Request Sent</h3>
                      <p>
                        Your request has been sent to <strong>{user.poRemovalNotification.poName}</strong> (Placement Officer).
                        You will be notified once they review your request.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3>You've been removed from the Placement Directory</h3>
                      <p>
                        <strong>{user.poRemovalNotification.poName}</strong>, your Placement Officer, has removed
                        your entry from the university's placement directory.
                        Please choose how you'd like to proceed:
                      </p>
                      {showReaddInput ? (
                        <div className="readd-message-box">
                          <textarea
                            placeholder="Optional: explain why you'd like to be re-added (e.g. 'I am still actively looking for placements')..."
                            value={readdMessage}
                            onChange={e => setReaddMessage(e.target.value)}
                            rows={3}
                          />
                          <div className="readd-actions">
                            <button
                              className="removal-btn readd"
                              onClick={() => handleRespondToRemoval("request_readd")}
                              disabled={respondingToRemoval}
                            >
                              <Send size={16} /> {respondingToRemoval ? "Sending..." : "Send Request"}
                            </button>
                            <button
                              className="removal-btn cancel"
                              onClick={() => setShowReaddInput(false)}
                              disabled={respondingToRemoval}
                            >
                              <X size={16} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="removal-banner-actions">
                          <button
                            className="removal-btn accept"
                            onClick={() => handleRespondToRemoval("accept")}
                            disabled={respondingToRemoval}
                          >
                            <CheckCircle2 size={16} /> Accept & Move On
                          </button>
                          <button
                            className="removal-btn readd"
                            onClick={() => setShowReaddInput(true)}
                          >
                            <RotateCcw size={16} /> Request Re-addition
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="placements-grid">
          {/* Status Section */}
          <div className="status-card card">
            <div className="card-header-flex">
              <h2>Hiring Visibility</h2>
              <button className="edit-btn" onClick={() => setShowUpdateModal(true)}>
                <Edit size={16} /> Edit Profile Details
              </button>
            </div>
            <div className="status-item">
              <div className="status-info">
                <h3>Make Profile Searchable</h3>
                <p>Allow HRs and Recruiters to find you in the Talent Discovery portal.</p>
              </div>
              <div className="toggle-wrapper">
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={user?.isPlacementReady} 
                    onChange={handleToggleSearchable}
                    disabled={toggling}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
            
            <div className={`status-badge ${user?.isPlacementReady ? 'online' : 'offline'}`}>
              <div className="dot" /> 
              {user?.isPlacementReady ? "Your profile is visible to recruiters" : "Your profile is currently hidden"}
            </div>

            <button 
              className="preview-btn" 
              onClick={() => {
                if (user?._id) {
                  navigate(`/candidate/${user._id}`);
                } else {
                  fetchUser(); // Try to refetch
                  alert("Syncing profile... Please try again in a moment.");
                }
              }}
            >
              <Eye size={18} /> Preview My Talent Profile
            </button>
          </div>

          <div className="stats-card card">
            <h2>Placement Governance</h2>
            <div className="governance-status">
              {user?.governance?.isLocked ? (
                <div className="restriction-alert error">
                  <Lock size={20} />
                  <div className="alert-text">
                    <strong>Placement Access Locked</strong>
                    <p>Your Placement Officer has suspended your eligibility for all on-campus drives. Please contact your T&P cell for clarification.</p>
                  </div>
                </div>
              ) : (
                <div className="governance-rules">
                  <div className="rule-item">
                    <IndianRupee size={18} />
                    <div className="rule-info">
                      <strong>Salary Multiplier (2X/3X)</strong>
                      <span>{user?.governance?.multiplier > 0 ? `${user.governance.multiplier}X Multiplier Active` : "No multiplier restriction"}</span>
                    </div>
                  </div>
                  <div className="rule-item">
                    <Briefcase size={18} />
                    <div className="rule-info">
                      <strong>Allowed Roles</strong>
                      <span>{user?.governance?.allowedRoles?.length > 0 ? user.governance.allowedRoles.join(", ") : "All roles allowed"}</span>
                    </div>
                  </div>
                  <div className="rule-item">
                    <Building size={18} />
                    <div className="rule-info">
                      <strong>Allowed Categories</strong>
                      <span>{user?.governance?.allowedCategories?.length > 0 ? user.governance.allowedCategories.join(", ") : "All categories (Intern/FTE) allowed"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="po-note">
              <ShieldCheck size={16} /> 
              These restrictions are set by <strong>{user?.university}</strong> Placement Cell to ensure fair opportunities for all students.
            </div>
          </div>

          {/* Verification Stats */}
          <div className="stats-card card">
            <h2>Verification Status</h2>
            <ul className="v-list">
              <li>
                <div className="v-icon"><GraduationCap size={20} /></div>
                <div className="v-text">
                  <strong>University Link</strong>
                  <span>{user?.university || "Not linked"}</span>
                </div>
                {user?.university ? <CheckCircle size={20} color="#1dbf73" /> : <Clock size={20} color="#f1c40f" />}
              </li>
              <li>
                <div className="v-icon"><ShieldCheck size={20} /></div>
                <div className="v-text">
                  <strong>Academic Credentials</strong>
                  <span>Verified by Placement Officer</span>
                </div>
                {user?.studentVerification?.status === "approved" ? <CheckCircle size={20} color="#1dbf73" /> : <Clock size={20} color="#f1c40f" />}
              </li>
              {user?.profileUpdateRequests?.some(r => r.status === "pending") && (
                <li className="pending-req-item">
                  <div className="v-icon warning"><Clock size={20} /></div>
                  <div className="v-text">
                    <strong>Update Request Pending</strong>
                    <span>Admin is reviewing your profile changes.</span>
                  </div>
                </li>
              )}
            </ul>
            
            <div className="po-note">
              <Building2 size={16} /> 
              Your Placement Officer (PO) can recommend your profile to HRs for campus drives.
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="placements-info card">
          <div className="info-icon"><Search size={40} color="#3b82f6" /></div>
          <div className="info-text">
            <h2>How Recruiters See You</h2>
            <p>HRs filter candidates based on <strong>ATS Scores</strong> and <strong>Verified Skills</strong>. Make sure your Career AI analysis is up to date to rank higher in search results.</p>
            <div className="info-actions">
              <button className="go-ai-btn" onClick={() => navigate("/career-ai")}>
                Update Resume Analysis
              </button>
              <button className="secondary-btn" onClick={() => setShowUpdateModal(true)}>
                Add Skill Proofs
              </button>
            </div>
          </div>
        </div>
      </>
    ) : activeTab === "hrs" ? (
      <div className="hr-directory">
        {/* ... existing HR search code ... */}
        <div className="search-section card">
          <h2>Find Corporate HRs</h2>
          <p>Connect with verified HRs from top companies who have opted into the Talent Outreach program.</p>
          <form onSubmit={handleHrSearch} className="hr-search-bar">
            <div className="input-with-icon">
              <Building size={20} />
              <input 
                type="text" 
                placeholder="Search by Company Name (e.g. Google, Microsoft...)" 
                value={hrSearchQuery}
                onChange={(e) => setHrSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" disabled={hrLoading}>
              <Search size={18} /> {hrLoading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        <div className="hr-list-grid">
          {hrLoading ? (
            <div className="loading-container"><p>Loading corporate partners...</p></div>
          ) : hrs.length === 0 ? (
            <div className="empty-results card">
              <p>No verified corporate partners found matching your search.</p>
            </div>
          ) : (
            hrs.map(hr => (
              <div key={hr._id} className="hr-profile-card card">
                <div className="hr-card-top">
                  <img src={hr.img || "/images/noavatar.png"} alt="" className="hr-avatar" />
                  <div className="hr-identity">
                    <h3>{hr.hrVerification?.companyName}</h3>
                    <p>{hr.username} • Verified HR</p>
                  </div>
                </div>
                <p className="hr-desc">{hr.desc || "Verified recruitment partner looking for top-tier talent."}</p>
                <div className="hr-card-footer">
                  <button className="message-hr-btn" onClick={() => handleMessageHR(hr._id)}>
                    <MessageSquare size={16} /> Direct Message
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    ) : activeTab === "offers" ? (
      <div className="my-offers-section">
        <div className="offers-header card">
          <h2>My Placement Success</h2>
          <p>Congratulations on your achievements! All your hired offers are listed here.</p>
        </div>

        <div className="offers-grid">
          {offersLoading ? (
            <div className="loading-container"><p>Fetching your offers...</p></div>
          ) : myOffers.length === 0 ? (
            <div className="empty-results card">
              <Award size={48} color="#94a3b8" />
              <p>You haven't received any offers yet. Keep improving your skills and applying!</p>
              <button className="go-ai-btn" onClick={() => navigate("/job-board")}>Browse Jobs</button>
            </div>
          ) : (
            myOffers.map(offer => (
              <div key={offer._id} className="offer-profile-card card">
                <div className="offer-card-top">
                  <div className="offer-badge hired">HIRED</div>
                  <div className="offer-identity">
                    <h3>{offer.jobId?.jobRole}</h3>
                    <p>{offer.jobId?.companyName} • {offer.jobId?.isOnCampus ? "On-Campus" : "Off-Campus"}</p>
                  </div>
                </div>
                <div className="offer-details-grid">
                  <div className="detail-item">
                    <IndianRupee size={16} />
                    <span><strong>Package:</strong> {offer.jobId?.ctc}</span>
                  </div>
                  <div className="detail-item">
                    <Briefcase size={16} />
                    <span><strong>Type:</strong> {offer.jobId?.category}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={16} />
                    <span><strong>Date:</strong> {new Date(offer.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="offer-card-footer">
                  <button className="view-job-btn" onClick={() => navigate(`/job/${offer.jobId?._id}`)}>
                    View Job Posting
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    ) : (
        <div className="branch-request-section">
          {checkingPO ? (
            <div className="loading-container"><p>Checking for university Placement Officer...</p></div>
          ) : !poExists ? (
            <div className="no-po-alert card">
              <div className="alert-icon-ring">
                <AlertTriangle size={48} color="#f59e0b" />
              </div>
              <h2>University PO Not Registered</h2>
              <p>
                Branch change requests require verification from your university's official Placement Officer. 
                Currently, <strong>{user?.university}</strong> has no registered PO on this platform.
              </p>
              <div className="alert-footer">
                <p>Please contact your college's T&P cell and ask them to register on UniServe to enable this feature.</p>
              </div>
            </div>
          ) : (
            <div className="branch-grid">
              <div className="request-form-card card">
                <h2>Branch Change Request</h2>
                <p className="subtitle">Request your Placement Officer to update your academic branch and specialization.</p>
                
                <form onSubmit={handleBranchSubmit} className="branch-form">
                  <div className="input-group">
                    <label>Academic Branch</label>
                    <select 
                      value={branchFormData.requestedBranch}
                      onChange={(e) => setBranchFormData({...branchFormData, requestedBranch: e.target.value})}
                      required
                    >
                      <option value="">-- Select Branch --</option>
                      {branchOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {branchFormData.requestedBranch === "Other" && (
                    <div className="input-group">
                      <label>Specify Branch</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Chemical Engineering"
                        value={branchFormData.otherBranch}
                        onChange={(e) => setBranchFormData({...branchFormData, otherBranch: e.target.value})}
                        required
                      />
                    </div>
                  )}

                  <div className="input-group">
                    <label>Specialization (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. AI, Data Science, Cyber Security"
                      value={branchFormData.requestedSpecialization}
                      onChange={(e) => setBranchFormData({...branchFormData, requestedSpecialization: e.target.value})}
                    />
                    <small className="hint">Mention your specific field of study if applicable.</small>
                  </div>

                  <div className="input-group">
                    <label>Proof of Change / Current ID (Optional)</label>
                    <div className="upload-box-small">
                      <input 
                        type="file" 
                        id="branch-proof" 
                        onChange={handleBranchProofUpload}
                        disabled={uploading}
                      />
                      <label htmlFor="branch-proof">
                        <Upload size={18} />
                        {uploading ? "Uploading..." : branchFormData.proof ? "Proof Attached ✅" : "Upload Proof PDF/Image"}
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="submit-req-btn" disabled={submittingBranch}>
                    {submittingBranch ? "Submitting..." : "Submit Request to PO"}
                  </button>
                </form>
              </div>

              <div className="request-status-card card">
                <h2>Current Status</h2>
                {user?.branchChangeRequest?.status ? (
                  <div className={`status-display ${user.branchChangeRequest.status}`}>
                    <div className="status-header">
                      {user.branchChangeRequest.status === "pending" && <Clock size={24} color="#f59e0b" />}
                      {user.branchChangeRequest.status === "approved" && <CheckCircle size={24} color="#10b981" />}
                      {user.branchChangeRequest.status === "rejected" && <AlertTriangle size={24} color="#ef4444" />}
                      <h3>Request {user.branchChangeRequest.status.charAt(0).toUpperCase() + user.branchChangeRequest.status.slice(1)}</h3>
                    </div>

                    <div className="request-details">
                      <div className="detail-row">
                        <span>Requested:</span>
                        <strong>{user.branchChangeRequest.requestedBranch}</strong>
                      </div>
                      {user.branchChangeRequest.requestedSpecialization && (
                        <div className="detail-row">
                          <span>Specialization:</span>
                          <strong>{user.branchChangeRequest.requestedSpecialization}</strong>
                        </div>
                      )}
                      <div className="detail-row">
                        <span>Submitted:</span>
                        <strong>{new Date(user.branchChangeRequest.updatedAt).toLocaleDateString()}</strong>
                      </div>
                    </div>

                    {user.branchChangeRequest.status === "rejected" && (
                      <div className="rejection-box">
                        <strong>Rejection Reason:</strong>
                        <p>{user.branchChangeRequest.rejectionReason}</p>
                        <p className="reapply-hint">You can update the details in the form and submit a new request.</p>
                      </div>
                    )}

                    {user.branchChangeRequest.status === "approved" && (
                      <div className="success-box">
                        <p>Your profile has been updated! Your new branch is now visible to recruiters.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-request">
                    <p>You haven't submitted any branch change requests yet.</p>
                    <p className="hint">Need to update your branch? Fill out the form to request approval from your PO.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Update Modal */}
        {showUpdateModal && (
          <div className="update-modal-overlay">
            <div className="update-modal-content">
              <button className="close-modal" onClick={() => setShowUpdateModal(false)}>
                <X size={24} />
              </button>
              <h2>Request Profile Update</h2>
              <p className="modal-subtitle">Submit changes and optional proofs to admin for verification.</p>

              <form onSubmit={handleSubmitUpdate} className="update-form">
                <div className="form-grid">
                  <div className="input-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>University / College</label>
                    <input 
                      type="text" 
                      value={formData.university}
                      onChange={(e) => setFormData({...formData, university: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Graduation Year</label>
                    <input 
                      type="number" 
                      value={formData.graduationYear}
                      onChange={(e) => setFormData({...formData, graduationYear: e.target.value})}
                    />
                  </div>
                  <div className="input-group">
                    <label>Verified Skills (Comma separated)</label>
                    <input 
                      type="text" 
                      value={formData.skills}
                      onChange={(e) => setFormData({...formData, skills: e.target.value})}
                      placeholder="e.g. React, Node.js, Python"
                    />
                  </div>
                </div>

                <div className="input-group full">
                  <label>Professional Summary</label>
                  <textarea 
                    value={formData.desc}
                    onChange={(e) => setFormData({...formData, desc: e.target.value})}
                    rows="3"
                  />
                </div>

                <div className="resume-update-section">
                  <label>Verified Resume (Optional)</label>
                  <div className="upload-box-small">
                    <input 
                      type="file" 
                      id="resume-upload" 
                      onChange={(e) => handleFileUpload(e, "resume")}
                      disabled={uploading}
                    />
                    <label htmlFor="resume-upload">
                      <FileText size={18} />
                      {uploading ? "Uploading..." : "Update Resume PDF"}
                    </label>
                  </div>
                  {formData.resumeUrl && <span className="upload-success">✅ Resume Added to Request</span>}
                </div>

                <div className="proof-upload-section">
                  <h3>Supportive Documents / Proofs (Optional)</h3>
                  <p className="modal-subtitle">Upload transcripts, College ID cards, Certificates for skill proof, Resumes, or other proofs to verify changes.</p>
                  
                  <div className="proof-upload-grid">
                    <div className="upload-box-small">
                      <input type="file" id="cert-upload" onChange={(e) => handleFileUpload(e, "proof", "Transcript")} disabled={uploading} />
                      <label htmlFor="cert-upload">
                        <Upload size={16} /> Transcripts
                      </label>
                    </div>
                    <div className="upload-box-small">
                      <input type="file" id="id-upload" onChange={(e) => handleFileUpload(e, "proof", "College ID")} disabled={uploading} />
                      <label htmlFor="id-upload">
                        <ShieldCheck size={16} /> College ID Card
                      </label>
                    </div>
                    <div className="upload-box-small">
                      <input type="file" id="gov-upload" onChange={(e) => handleFileUpload(e, "proof", "Skill Certificate")} disabled={uploading} />
                      <label htmlFor="gov-upload">
                        <UserCheck size={16} /> Certificates for skill proof
                      </label>
                    </div>
                    <div className="upload-box-small">
                      <input type="file" id="resume-proof-upload" onChange={(e) => handleFileUpload(e, "proof", "Verified Resume")} disabled={uploading} />
                      <label htmlFor="resume-proof-upload">
                        <FileText size={16} /> Verified Resume
                      </label>
                    </div>
                    <div className="upload-box-small">
                      <input type="file" id="other-upload" onChange={(e) => handleFileUpload(e, "proof", "Other Proof")} disabled={uploading} />
                      <label htmlFor="other-upload">
                        <Plus size={16} /> Other Proofs
                      </label>
                    </div>
                  </div>

                  {proofs.length > 0 && (
                    <div className="proofs-list mt-4">
                      {proofs.map((p, i) => (
                        <div key={i} className="proof-tag active">
                          <FileText size={14} /> 
                          <span className="proof-label">[{p.label}]</span> Proof {i+1}
                          <X size={14} className="remove-proof" onClick={() => setProofs(prev => prev.filter((_, idx) => idx !== i))} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="submit-req-btn" disabled={updateLoading}>
                  {updateLoading ? "Submitting..." : "Submit Update Request"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Placements;
