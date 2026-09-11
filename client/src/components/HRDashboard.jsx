import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";
import { Search, MapPin, Award, UserCheck, MessageSquare, Send, Building, ShieldCheck, Edit, FileText, Upload, X, Clock, AlertCircle, Briefcase, Plus, Ticket } from "lucide-react";
import "./HRDashboard.css";
import SuspensionBanner from "./SuspensionBanner";

const HRDashboard = ({ user: currentUser, onShowCoupons }) => {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState("search");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hrProofs, setHrProofs] = useState([]);
  const [hrFormData, setHrFormData] = useState({
    companyName: currentUser?.hrVerification?.companyName || "",
    desc: currentUser?.desc || ""
  });
  const [talents, setTalents] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    university: "",
    skills: "",
    minScore: "",
    graduationYear: ""
  });
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const fetchHRData = async () => {
    try {
      if (currentUser?.hrVerification?.status !== "approved") {
        setLoading(false);
        return;
      }

      const [talentRes, collRes, univRes] = await Promise.all([
        newRequest.get("/hr/talent"),
        newRequest.get("/proposals"),
        newRequest.get("/hr/universities")
      ]);
      setTalents(talentRes.data);
      setCollaborations(collRes.data);
      setUniversities(univRes.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  useEffect(() => {
    if (showUpdateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showUpdateModal]);

  const handleFileUpload = async (e, label = "Corporate Document") => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { default: upload } = await import("../utils/upload");
      const url = await upload(file);
      setHrProofs(prev => [...prev, { url, label }]);
    } catch (err) {
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
      if (hrFormData.companyName !== currentUser.hrVerification?.companyName) {
        requestedChanges["hrVerification.companyName"] = hrFormData.companyName;
      }
      if (hrFormData.desc !== currentUser.desc) {
        requestedChanges.desc = hrFormData.desc;
      }

      if (Object.keys(requestedChanges).length === 0 && hrProofs.length === 0) {
        alert("No changes to submit.");
        setUpdateLoading(false);
        return;
      }

      await newRequest.post("/users/profile-update-request", {
        requestedChanges,
        proofs: hrProofs
      });
      alert("Update request submitted! Admin will verify changes.");
      setShowUpdateModal(false);
      setHrProofs([]);
      
      const res = await newRequest.get("/users/me");
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      window.location.reload();
    } catch (err) {
      alert("Failed to submit update request.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    setTogglingVisibility(true);
    try {
      const isVisible = !currentUser.hrVerification?.isProfileVisible;
      const res = await newRequest.put(`/users/${currentUser._id}`, {
        "hrVerification.isProfileVisible": isVisible
      });
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      alert(`Visibility ${isVisible ? "enabled" : "disabled"}.`);
      window.location.reload();
    } catch (err) {
      console.log(err);
      alert("Failed to update visibility.");
    } finally {
      setTogglingVisibility(false);
    }
  };

  const [resubmitData, setResubmitData] = useState({
    companyName: currentUser?.hrVerification?.companyName || "",
    workEmail: currentUser?.hrVerification?.workEmail || "",
  });

  const [proofFile, setProofFile] = useState(null);
  const [resubmitting, setResubmitting] = useState(false);

  const handleResubmit = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      alert("Please upload your Company ID / Proof PDF.");
      return;
    }

    setResubmitting(true);
    try {
      const upload = (await import("../utils/upload")).default;
      const proofUrl = await upload(proofFile);

      const res = await newRequest.post("/users/resubmit-verification", {
        ...resubmitData,
        proof: proofUrl
      });
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      window.location.reload();
    } catch (err) {
      alert("Failed to resubmit verification.");
    } finally {
      setResubmitting(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const queryParams = new URLSearchParams();
      if (filters.university) queryParams.append("university", filters.university);
      if (filters.skills) queryParams.append("skill", filters.skills);
      if (filters.minScore) queryParams.append("minAts", filters.minScore);
      if (filters.graduationYear) queryParams.append("graduationYear", filters.graduationYear);

      const res = await newRequest.get(`/hr/search-students?${queryParams.toString()}`);
      setTalents(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleHire = async (studentId) => {
    try {
      const res = await newRequest.post("/conversations", { to: studentId });
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      console.log(err);
    }
  };

  const handleContactPO = (universityName) => {
    navigate(`/po/contact?university=${universityName}`);
  };

  if (loading) return <div>Loading HR Dashboard...</div>;

  if (currentUser.hrVerification?.status !== "approved") {
    return (
      <div className="pending-verification-container">
        <div className="pending-verification-card card">
          <h3>{currentUser.hrVerification?.status === "rejected" ? "Verification Rejected" : "Verification Pending"}</h3>
          <p>Your HR account is {currentUser.hrVerification?.status === "rejected" ? "rejected" : "currently being reviewed by the Admin"}.</p>
          {currentUser.hrVerification?.status === "rejected" && (
            <div className="rejection-reason alert">
              <strong>Reason:</strong> {currentUser.hrVerification?.rejectionReason}
            </div>
          )}
        </div>

        {currentUser.hrVerification?.status === "rejected" && (
          <div className="resubmit-verification-card card">
            <h3>Request Verification Again</h3>
            <form onSubmit={handleResubmit}>
              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  value={resubmitData.companyName} 
                  onChange={(e) => setResubmitData({...resubmitData, companyName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Work Email</label>
                <input 
                  type="email" 
                  value={resubmitData.workEmail} 
                  onChange={(e) => setResubmitData({...resubmitData, workEmail: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Company ID / Proof (PDF)</label>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={resubmitting}>
                {resubmitting ? "Uploading & Submitting..." : "Resubmit Request"}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  const pendingProposalsCount = collaborations.filter(c => c.initiatedBy === "po" && c.status === "pending").length;

  return (
    <div className="hr-dashboard">
      <div className="section-header">
        <div className="header-top-flex">
          <div className="header-info-main">
            <div className="title-flex">
              <h2>Corporate Recruitment Portal</h2>
              {currentUser.reliabilityStatus && currentUser.reliabilityStatus !== "normal" && (
                <span className={`reliability-badge ${currentUser.reliabilityStatus}`}>
                  {currentUser.reliabilityStatus === "suspended" ? "Account Suspended" : "Low Trust Badge"}
                </span>
              )}
            </div>
            <p>Verified Talent & Institutional Collaboration</p>
          </div>
          <div className="header-actions-row">
            <button 
              className="edit-profile-btn" 
              onClick={() => setShowUpdateModal(true)}
              disabled={currentUser.reliabilityStatus === "suspended"}
              title={currentUser.reliabilityStatus === "suspended" ? "Your account is suspended" : ""}
            >
              <Edit size={16} /> Edit Corporate Details
            </button>
            <div className="visibility-toggle-card">
              <div className="toggle-text">
                <strong>Hiring Visibility</strong>
                <small>{currentUser.hrVerification?.isProfileVisible ? "You're visible to POs" : "Your profile is hidden"}</small>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={currentUser.hrVerification?.isProfileVisible} 
                  onChange={handleToggleVisibility}
                  disabled={togglingVisibility || currentUser.reliabilityStatus === "suspended"}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {(() => {
        const latestRequest = currentUser.profileUpdateRequests?.length > 0 
          ? currentUser.profileUpdateRequests[currentUser.profileUpdateRequests.length - 1]
          : null;

        if (latestRequest?.status === "pending") {
          return (
            <div className="update-status-banner pending alert">
              <Clock size={20} />
              <div className="text">
                <strong>Update Request Pending</strong>
                <span>Admin is reviewing your recent changes to the corporate profile.</span>
              </div>
            </div>
          );
        }

        if (latestRequest?.status === "rejected") {
          return (
            <div className="update-status-banner rejected alert">
              <AlertCircle size={20} />
              <div className="text">
                <strong>Update Request Rejected</strong>
                <span>Reason: {latestRequest.rejectionReason}</span>
                <small>You can update the details and submit again.</small>
              </div>
              <button className="dismiss-btn" onClick={() => setShowUpdateModal(true)}>Re-apply</button>
            </div>
          );
        }

        return null;
      })()}

      <SuspensionBanner user={currentUser} onAppealSubmitted={fetchHRData} />

      <div className="hr-nav">
        <button className={activeSubTab === "search" ? "active" : ""} onClick={() => setActiveSubTab("search")}><Search size={18}/> Talent Search</button>
        <button 
          onClick={() => navigate("/hr-outreach")}
          disabled={currentUser.reliabilityStatus === "suspended"}
          title={currentUser.reliabilityStatus === "suspended" ? "Your account is suspended" : ""}
        ><Building size={18}/> Outreach Center {pendingProposalsCount > 0 && <span className="badge-count" style={{background: "#ef4444", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", marginLeft: "5px"}}>{pendingProposalsCount}</span>}</button>
        <button 
          className={activeSubTab === "jobs" ? "active" : ""} 
          onClick={() => navigate("/manage-jobs")}
          disabled={currentUser.reliabilityStatus === "suspended"}
          title={currentUser.reliabilityStatus === "suspended" ? "Your account is suspended" : ""}
        ><Briefcase size={18}/> Manage Jobs</button>
      </div>

      {activeSubTab === "search" && (
        <>
          {pendingProposalsCount > 0 && (
            <div className="pending-proposals-banner alert" style={{background: "#eff6ff", border: "1px solid #dbeafe", color: "#1e40af", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 25px", borderRadius: "16px", marginBottom: "25px"}}>
              <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                <Building className="text-blue-600" size={24} />
                <div>
                  <strong style={{color: "#1e3a8a"}}>You have {pendingProposalsCount} pending PO proposals</strong>
                  <p style={{margin: 0, fontSize: "14px", color: "#1d4ed8"}}>Review them in the Outreach Center.</p>
                </div>
              </div>
              <button className="view-btn-sm" onClick={() => navigate("/hr-outreach")} style={{padding: "8px 16px", background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer"}}>View Proposals</button>
            </div>
          )}
          <div className="talent-search-form card">
            <form onSubmit={handleSearch} className="search-grid">
              <div className="filter-group">
                <label>University</label>
                <select onChange={(e) => setFilters(prev => ({ ...prev, university: e.target.value }))}>
                  <option value="">All Universities</option>
                  {universities.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Skills</label>
                <input 
                  placeholder="e.g. React, Node, Python" 
                  onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
                />
              </div>
              <div className="filter-group">
                <label>Min ATS Score</label>
                <input 
                  type="number" 
                  placeholder="0-100" 
                  onChange={(e) => setFilters(prev => ({ ...prev, minScore: e.target.value }))}
                />
              </div>
              <div className="filter-group">
                <label>Batch</label>
                <input 
                  type="number" 
                  placeholder="2026" 
                  onChange={(e) => setFilters(prev => ({ ...prev, graduationYear: e.target.value }))}
                />
              </div>
              <button type="submit" className="action-btn emerald search-btn"><Search size={18}/> Search</button>
            </form>
          </div>

          <div className="talent-grid">
            {talents.map(talent => (
              <div key={talent._id} className="talent-card card">
                <div className="card-header">
                  <div className="main">
                    <img src={talent.img || "/images/noavatar.png"} alt="" />
                    <div className="info">
                      <h4>
                        {talent.username}
                        {(talent.trustBadge === "pro" || talent.trustBadge === "expert" || talent.subscription === "business") && (
                          <ShieldCheck size={14} className="verified-icon" title="Verified Talent" style={{marginLeft: "5px", color: "#10b981", display: "inline"}} />
                        )}
                      </h4>
                      <span>{talent.university}</span>
                    </div>
                  </div>
                  <div className="score-badge">{talent.resumeData.atsScore}</div>
                </div>
                <div className="academic-info">
                  <p>Batch: <strong>{talent.graduationYear}</strong></p>
                  <p>Tier: <strong className="tier-pro">Verified Talent</strong></p>
                </div>
                <div className="skills">
                  {talent.resumeData.parsedSkills.slice(0, 4).map(s => <span key={s} className="tag">{s}</span>)}
                </div>
                <div className="card-footer">
                  <button 
                    className="hire-btn" 
                    onClick={() => handleHire(talent._id)}
                    disabled={currentUser.reliabilityStatus === "suspended"}
                  >
                    <MessageSquare size={16}/> Hire
                  </button>
                  <button className="view-btn-outline" onClick={() => navigate(`/candidate/${talent._id}`)}>
                    View
                  </button>
                  <button 
                    className="contact-po-btn" 
                    title={currentUser.reliabilityStatus === "suspended" ? "Your account is suspended" : "Contact Placement Office"}
                    onClick={() => handleContactPO(talent.university)}
                    disabled={currentUser.reliabilityStatus === "suspended"}
                  >
                    <Building size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="update-modal card">
            <button className="close-btn" onClick={() => setShowUpdateModal(false)}><X size={20}/></button>
            <h3>Update Corporate Profile</h3>
            <p className="subtitle">Submit changes and optional proofs to admin for verification.</p>
            
            <form onSubmit={handleSubmitUpdate}>
              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  value={hrFormData.companyName}
                  onChange={(e) => setHrFormData({...hrFormData, companyName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={hrFormData.desc}
                  onChange={(e) => setHrFormData({...hrFormData, desc: e.target.value})}
                  rows="4"
                  required
                />
              </div>
              
              <div className="proofs-upload-section">
                <label>Update Verification Proofs (Optional)</label>
                <div className="upload-box">
                  <input type="file" accept=".pdf" onChange={handleFileUpload} id="proof-upload" />
                  <label htmlFor="proof-upload" className="upload-label">
                    <Upload size={20} /> {uploading ? "Uploading..." : "Upload PDF Proof"}
                  </label>
                </div>
                <div className="uploaded-list">
                  {hrProofs.map((p, i) => (
                    <div key={i} className="proof-item">
                      <FileText size={16} /> {p.label}
                      <button type="button" onClick={() => setHrProofs(hrProofs.filter((_, idx) => idx !== i))}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button type="submit" className="submit-btn emerald" disabled={updateLoading}>
                  {updateLoading ? "Submitting..." : "Submit for Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
