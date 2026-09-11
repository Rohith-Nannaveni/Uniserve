import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import newRequest from "../utils/newRequest";
import ProfileSettings from "./ProfileSettings";
import { 
  BarChart2, 
  Briefcase, 
  GraduationCap, 
  Mail, 
  MessageSquare, 
  TrendingUp, 
  UserCheck, 
  Users, 
  IndianRupee, 
  Building2,
  ChevronRight,
  ArrowRight,
  Settings,
  ShieldCheck,
  Save,
  RotateCcw,
  Download,
  X,
  User,
  Ticket,
  CheckCircle,
  Trash2,
  AlertTriangle
} from "lucide-react";
import "./PODashboard.css";
import SuspensionBanner from "./SuspensionBanner";

const PODashboard = ({ user: userProp, onShowCoupons }) => {
  const [currentUser, setCurrentUser] = useState(userProp);

  useEffect(() => {
    setCurrentUser(userProp);
  }, [userProp]);

  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [sharesHistory, setSharesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("analytics");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [approving, setApproving] = useState(false);
  const [onlyUnplaced, setOnlyUnplaced] = useState(false);

  // Drive Data Requests State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestStage, setRequestStage] = useState("Applied");
  const [requesting, setRequesting] = useState(false);
  const [driveRequests, setDriveRequests] = useState([]); // [{jobId, stage, status}]

  // Branch Approvals State
  const [branchRequests, setBranchRequests] = useState([]);
  const [processingBranch, setProcessingBranch] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ show: false, studentId: "", reason: "" });

  const [settings, setSettings] = useState({
    autoApplyMultiplier: false,
    globalMultiplierValue: 2.0,
    branchRestrictions: []
  });
  const [newBranchRule, setNewBranchRule] = useState({ branch: "", allowedRoles: "" });

  const handleAddBranchRule = () => {
    if (!newBranchRule.branch || !newBranchRule.allowedRoles) return;
    const rolesArr = newBranchRule.allowedRoles.split(",").map(s => s.trim()).filter(s => s !== "");
    setSettings({
      ...settings,
      branchRestrictions: [...(settings.branchRestrictions || []), { branch: newBranchRule.branch, allowedRoles: rolesArr }]
    });
    setNewBranchRule({ branch: "", allowedRoles: "" });
  };

  const handleRemoveBranchRule = (index) => {
    const updated = settings.branchRestrictions.filter((_, i) => i !== index);
    setSettings({ ...settings, branchRestrictions: updated });
  };
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Global Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const [togglingVisibility, setTogglingVisibility] = useState(false);

  const fetchPOData = async () => {
    try {
      if (currentUser?.poVerification?.status !== "approved") {
        setLoading(false);
        return;
      }

      const [anRes, histRes, settingsRes, sharesRes, pendingRes, branchRes] = await Promise.all([
        newRequest.get("/po/analytics"),
        newRequest.get("/proposals"),
        newRequest.get("/po/settings"),
        newRequest.get("/po/sharing-history"),
        newRequest.get("/po/pending-jobs"),
        newRequest.get("/branch/pending")
      ]);
      setAnalytics(anRes.data);
      setHistory(histRes.data || []);
      if (settingsRes.data) setSettings(settingsRes.data);
      setSharesHistory(sharesRes.data || []);
      setPendingJobs(pendingRes.data || []);
      setBranchRequests(branchRes.data || []);

      // Fetch all requests for all active/pending jobs for the PO
      if (pendingRes.data?.length > 0) {
        const allReqsPromises = pendingRes.data.map(job => 
          newRequest.get(`/po/drive-requests/${job._id}`).catch(() => ({ data: [] }))
        );
        const allReqsRes = await Promise.all(allReqsPromises);
        const flatReqs = allReqsRes.flatMap(res => res.data);
        setDriveRequests(flatReqs);
      }
    } catch (err) {
      console.error("Error fetching PO data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchDecision = async (studentId, action, reason = "") => {
    setProcessingBranch(studentId);
    try {
      await newRequest.patch(`/branch/decision/${studentId}`, { action, rejectionReason: reason });
      alert(`Request ${action}d successfully!`);
      setRejectionModal({ show: false, studentId: "", reason: "" });
      fetchPOData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to process decision.");
    } finally {
      setProcessingBranch(null);
    }
  };

  const handleUpdateSettings = async () => {
    setSavingSettings(true);
    try {
      await newRequest.put("/po/settings", settings);
      alert("College-wide governance policies updated!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleGlobalReset = async () => {
    setResetting(true);
    try {
      await newRequest.post("/po/reset-campus-data");
      
      // Refresh data immediately before closing modal/showing alert
      // to ensure the dashboard background reflects the reset state
      await fetchPOData();
      
      setShowResetModal(false);
      setResetConfirmText("");
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 8000);
      alert("Season started! All student records reset and sharing history cleared.");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Reset failed.");
    } finally {
      setResetting(false);
    }
  };

  const handleToggleVisibility = async () => {
    if (!currentUser) return;
    setTogglingVisibility(true);
    try {
      const isVisible = !currentUser.poVerification?.isProfileVisible;
      const res = await newRequest.put(`/users/${currentUser._id}`, {
        "poVerification.isProfileVisible": isVisible
      });
      setCurrentUser(res.data);
      localStorage.setItem("currentUser", JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
      alert("Failed to update visibility.");
    } finally {
      setTogglingVisibility(false);
    }
  };

  const handleApproveJob = async (jobId) => {
    setApproving(true);
    try {
      const res = await newRequest.patch(`/po/approve-job/${jobId}`, { onlyUnplaced });
      alert(res.data.message || "Job approved and is now live for students!");
      setSelectedJob(null);
      setOnlyUnplaced(false);
      fetchPOData();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response?.data : null) || "Failed to approve job.";
      alert(errorMsg);
    } finally {
      setApproving(false);
    }
  };

  const handleRequestListData = async () => {
    if (!selectedJob) return;
    setRequesting(true);
    try {
      await newRequest.post("/po/request-list", { jobId: selectedJob._id, requestedStage: requestStage });
      alert(`Request for ${requestStage} list sent successfully!`);
      setShowRequestModal(false);
      fetchPOData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to send request.");
    } finally {
      setRequesting(false);
    }
  };

  const handleDownloadRequestedList = async (request) => {
    try {
      const res = await newRequest.get(`/po/requested-list/${request._id}`);
      const data = res.data;

      if (!data || data.length === 0) {
        return alert("No candidate data found for this list.");
      }

      const headers = ["Name", "Email", "Branch", "CGPA", "ATS Score", "Skills", "Stage Info", "Offer Details"];
      const csvData = data.map(row => [
        row.name,
        row.email,
        row.branch,
        row.cgpa,
        row.atsScore,
        `"${(row.skills || []).join(', ')}"`,
        row.status,
        `Package: ${row.offeredPackage}, Type: ${row.offerType}`
      ]);

      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${currentUser.university}_${request.requestedStage}_List.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to download list.");
    }
  };

  const handleRevokeDrive = async (job) => {
    if (!window.confirm("Are you sure you want to revoke this drive? It will be removed from student job boards and moved back to pending approvals.")) return;
    try {
      await newRequest.delete(`/po/revoke-drive/${job._id}`);
      alert("Drive revoked successfully.");
      fetchPOData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to revoke drive.");
    }
  };

  const handleDismissJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to hide this drive entry from your Command Center? (This will NOT affect student visibility or drive status)")) return;
    try {
      await newRequest.patch(`/po/dismiss-job/${jobId}`);
      setPendingJobs(pendingJobs.filter(j => j._id !== jobId));
    } catch (err) {
      console.error(err);
      alert("Failed to hide drive entry.");
    }
  };

  const handleDismissShare = async (shareId) => {
    if (!window.confirm("Are you sure you want to remove this entry from your history? (This will NOT remove the job for students)")) return;
    try {
      await newRequest.patch(`/po/dismiss-share/${shareId}`);
      setSharesHistory(sharesHistory.filter(s => s.shareId !== shareId));
    } catch (err) {
      console.error(err);
      alert("Failed to dismiss item.");
    }
  };

  const exportCompanyCSV = () => {
    if (!selectedCompany) return;
    
    const headers = ["Student Name", "Email", "Job Role", "Package (LPA)", "Offer Type", "ATS Score"];
    const csvData = selectedCompany.students.map(s => [
      s.username,
      s.email || "N/A",
      s.jobRole || "N/A",
      s.package || 0,
      s.offerType || "Full-time",
      s.atsScore || 0
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedCompany.name}_hires_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchPOData();
  }, []);

  if (loading) return <div className="loading-container">Loading Placement Portal...</div>;

  if (!currentUser) return <div className="loading-container">Please log in again.</div>;

  if (currentUser.poVerification?.status !== "approved") {
    return (
      <div className="pending-verification-container">
        <div className="pending-verification-card card">
          <h3>{currentUser.poVerification?.status === "rejected" ? "Verification Rejected" : "Verification Pending"}</h3>
          <p>Your Placement Officer account for <strong>{currentUser.university}</strong> is {currentUser.poVerification?.status === "rejected" ? "rejected" : "being reviewed"}.</p>
          {currentUser.poVerification?.status === "rejected" && (
            <div className="rejection-reason alert">
              <strong>Reason:</strong> {currentUser.poVerification?.rejectionReason}
            </div>
          )}
        </div>
      </div>
    );
  }

  const pendingProposalsCount = Array.isArray(history) ? history.filter(p => p.initiatedBy === "hr" && p.status === "pending").length : 0;

  return (
    <div className="po-dashboard">
      <div className="section-header">
        <div className="header-top-row">
          <div className="title-group">
            <div className="title-flex">
              <h2>{currentUser.university || "University"} - Placement Portal</h2>
              {currentUser.reliabilityStatus && currentUser.reliabilityStatus !== "normal" && (
                <span className={`reliability-badge ${currentUser.reliabilityStatus}`}>
                  {currentUser.reliabilityStatus === "suspended" ? "Account Suspended" : "Low Trust Badge"}
                </span>
              )}
            </div>
            <p>Institutional analytics and recruitment oversight.</p>
          </div>
          <div className="header-actions">
            <div className="visibility-card">
               <div className="v-text">
                  <strong>Visibility</strong>
                  <small>{currentUser.poVerification?.isProfileVisible ? "Visible to HRs" : "Hidden from HRs"}</small>
               </div>
               <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={!!currentUser.poVerification?.isProfileVisible} 
                    onChange={handleToggleVisibility}
                    disabled={togglingVisibility || currentUser.reliabilityStatus === "suspended"}
                  />
                  <span className="slider round"></span>
               </label>
            </div>
          </div>
        </div>
      </div>

      <SuspensionBanner user={currentUser} onAppealSubmitted={fetchPOData} />

      {resetSuccess && (
        <div className="reset-success-banner card">
          <div className="success-content">
            <div className="success-icon-ring">
              <TrendingUp size={24} color="#10b981" />
            </div>
            <div>
              <h3>New Placement Season Started!</h3>
              <p>All student records have been reset. Sharing history and UI preferences cleared. University analytics are now ready for fresh data.</p>
            </div>
          </div>
          <button className="close-banner-btn" onClick={() => setResetSuccess(false)}><X size={18}/></button>
        </div>
      )}

      <div className="po-nav">
        {/* Row 1: Information & Users */}
        <button className={activeSubTab === "analytics" ? "active" : ""} onClick={() => {setActiveSubTab("analytics"); setSelectedCompany(null);}}>
          <BarChart2 size={18}/> Analytics
        </button>
        <button 
          onClick={() => navigate("/po-students")}
          disabled={currentUser.reliabilityStatus === "suspended"}
          title={currentUser.reliabilityStatus === "suspended" ? "Your account is suspended" : ""}
        >
          <GraduationCap size={18}/> Students
        </button>
        <button className={activeSubTab === "companies" ? "active" : ""} onClick={() => setActiveSubTab("companies")}>
          <Building2 size={18}/> Recruiters
        </button>
        <button className={activeSubTab === "profile" ? "active" : ""} onClick={() => setActiveSubTab("profile")}>
          <User size={18}/> Profile
        </button>

        {/* Row 2: Operations & Drive Control */}
        <button 
          className={activeSubTab === "approvals" ? "active" : ""} 
          onClick={() => setActiveSubTab("approvals")}
          disabled={currentUser.reliabilityStatus === "suspended"}
        >
          <CheckCircle size={18}/> Approvals
        </button>
        <button className={activeSubTab === "shares" ? "active" : ""} onClick={() => setActiveSubTab("shares")}>
          <Briefcase size={18}/> My Shares
        </button>
        <button 
          onClick={() => navigate("/po-outreach")}
          disabled={currentUser.reliabilityStatus === "suspended"}
          title={currentUser.reliabilityStatus === "suspended" ? "Your account is suspended" : ""}
        >
          <Mail size={18}/> Outreach {pendingProposalsCount > 0 && <span className="badge-count">{pendingProposalsCount}</span>}
        </button>
        <button 
          className={activeSubTab === "governance" ? "active" : ""} 
          onClick={() => setActiveSubTab("governance")}
          disabled={currentUser.reliabilityStatus === "suspended"}
          title={currentUser.reliabilityStatus === "suspended" ? "Your account is suspended" : ""}
        >
          <Settings size={18}/> Governance
        </button>

        {/* Row 3: New Operations */}
        <button 
          className={activeSubTab === "branchApprovals" ? "active" : ""} 
          onClick={() => setActiveSubTab("branchApprovals")}
          disabled={currentUser.reliabilityStatus === "suspended"}
          title={currentUser.reliabilityStatus === "suspended" ? "Your account is suspended" : ""}
        >
          <ShieldCheck size={18}/> Branch Approvals
        </button>
      </div>

      {activeSubTab === "analytics" && analytics && (
        <div className="analytics-content">
          {pendingProposalsCount > 0 && (
            <div className="pending-proposals-banner alert">
              <div className="banner-info">
                <Mail className="text-blue-600" size={24} />
                <div>
                  <strong>{pendingProposalsCount} Pending Proposals</strong>
                  <p>HRs are waiting for your collaboration response.</p>
                </div>
              </div>
              <button 
                className="view-btn-sm" 
                onClick={() => navigate("/po-outreach")}
                disabled={currentUser.reliabilityStatus === "suspended"}
              >Review Now</button>
            </div>
          )}

          <div className="metrics-grid">
            <div className="stat-card card">
               <div className="stat-header">
                  <TrendingUp size={20} color="#3b82f6" />
                  <span>PLACEMENT RATE</span>
               </div>
               <div className="stat-value">{analytics.placementRate || 0}%</div>
               <div className="stat-footer">{analytics.placedCount || 0} / {analytics.businessCount || 0} Students Placed</div>
            </div>

            <div className="stat-card card">
               <div className="stat-header">
                  <IndianRupee size={20} color="#10b981" />
                  <span>AVG PACKAGE</span>
               </div>
               <div className="stat-value">{analytics.avgPackage || 0} LPA</div>
               <div className="stat-footer">Across all on-campus offers</div>
            </div>

            <div className="stat-card card">
               <div className="stat-header">
                  <UserCheck size={20} color="#6366f1" />
                  <span>PLACEMENT READY</span>
               </div>
               <div className="stat-value">{analytics.readyCount || 0}</div>
               <div className="stat-footer">Business students with &gt;70 ATS</div>
            </div>

            <div className="stat-card card">
               <div className="stat-header">
                  <BarChart2 size={20} color="#f59e0b" />
                  <span>AVG ATS SCORE</span>
               </div>
               <div className="stat-value">{analytics.avgAts || 0}</div>
               <div className="stat-footer">Overall campus talent level</div>
            </div>
          </div>

          <div className="charts-row">
            <div className="bracket-card card">
               <h3>Package Distribution</h3>
               <div className="bracket-list">
                  <div className="bracket-item">
                    <span>Below 5 LPA</span>
                    <div className="b-bar-bg"><div className="b-bar" style={{width: `${analytics.placedCount > 0 ? (analytics.brackets?.under5 / analytics.placedCount) * 100 : 0}%`, background: "#94a3b8"}}></div></div>
                    <strong>{analytics.brackets?.under5 || 0}</strong>
                  </div>
                  <div className="bracket-item">
                    <span>5 LPA - 10 LPA</span>
                    <div className="b-bar-bg"><div className="b-bar" style={{width: `${analytics.placedCount > 0 ? (analytics.brackets?.between5and10 / analytics.placedCount) * 100 : 0}%`, background: "#3b82f6"}}></div></div>
                    <strong>{analytics.brackets?.between5and10 || 0}</strong>
                  </div>
                  <div className="bracket-item">
                    <span>Above 10 LPA</span>
                    <div className="b-bar-bg"><div className="b-bar" style={{width: `${analytics.placedCount > 0 ? (analytics.brackets?.above10 / analytics.placedCount) * 100 : 0}%`, background: "#10b981"}}></div></div>
                    <strong>{analytics.brackets?.above10 || 0}</strong>
                  </div>
               </div>
            </div>

            <div className="top-talent-card card">
              <div className="card-header-flex">
                <h3>Top Performers</h3>
                <button 
                  className="link-btn" 
                  onClick={() => navigate("/po-students")}
                  disabled={currentUser.reliabilityStatus === "suspended"}
                >View All <ArrowRight size={14}/></button>
              </div>
              <div className="mini-talent-list">
                {analytics.topTalent?.map(s => (
                  <div key={s._id} className="mini-talent-item">
                    <img src={s.img || "/images/noavatar.png"} alt="" />
                    <div className="info">
                      <strong>{s.username}</strong>
                      <span>ATS: {s.resumeData?.atsScore || 0}</span>
                    </div>
                    <div className={`badge ${s.subscription || 'normal'}`}>{(s.subscription || 'normal').toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "companies" && analytics && (
        <div className="companies-content card">
          {!selectedCompany ? (
            <div className="company-list-view">
              <h3>Partner Companies & Hires</h3>
              <div className="company-grid">
                {analytics.companyStats && analytics.companyStats.length > 0 ? analytics.companyStats.map((company, idx) => (
                  <div key={idx} className="company-stat-card" onClick={() => setSelectedCompany({name: company.companyName, ...company})}>
                    <div className="c-info">
                      <div className="c-icon"><Building2 size={24} /></div>
                      <div>
                        <strong>{company.companyName}</strong>
                        <p>{company.count} Students Hired</p>
                      </div>
                    </div>
                    <ChevronRight size={20} color="#94a3b8" />
                  </div>
                )) : (
                  <div className="empty-state">No companies have recruited yet.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="company-detail-view">
              <div className="detail-header">
                <button className="back-link" onClick={() => setSelectedCompany(null)}><ArrowRight size={16} style={{transform: "rotate(180deg)"}}/> Back to List</button>
                <div className="header-info-row">
                  <h2>{selectedCompany.name} - Recruitment Details</h2>
                  <button className="export-btn" onClick={exportCompanyCSV}>
                    <Download size={18} /> Export CSV
                  </button>
                </div>
              </div>
              
              <table className="hired-students-table">
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>JOB ROLE</th>
                    <th>PACKAGE (LPA)</th>
                    <th>OFFER TYPE</th>
                    <th>ATS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCompany.students.map(s => (
                    <tr key={s._id}>
                      <td>
                        <div className="s-cell">
                          <img src={s.img || "/images/noavatar.png"} alt="" />
                          <span>{s.username}</span>
                        </div>
                      </td>
                      <td>{s.jobRole || "N/A"}</td>
                      <td><strong>{s.package} LPA</strong></td>
                      <td><span className="type-pill">{s.offerType}</span></td>
                      <td>{s.atsScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "shares" && (
        <div className="shares-content card">
          <div className="shares-header">
            <h3>My Sharing History</h3>
            <p>A history of all job postings you have shared with your university students.</p>
          </div>
          
          <div className="shares-list">
            {sharesHistory.length > 0 ? (
              <table className="hired-students-table">
                <thead>
                  <tr>
                    <th>COMPANY</th>
                    <th>JOB ROLE</th>
                    <th>SHARED AT</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {sharesHistory.map((share, idx) => (
                    <tr key={idx}>
                      <td><strong>{share.companyName}</strong></td>
                      <td>{share.jobRole}</td>
                      <td>{moment(share.sharedAt).format("MMM DD, YYYY")}</td>
                      <td>
                        <span className={`status-pill ${share.isClosed ? "rejected" : "approved"}`}>
                          {share.isClosed ? "Closed" : "Active"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="view-btn-sm" onClick={() => navigate(`/job/${share._id}`)}>View Job</button>
                          <button 
                            className="view-btn-sm" 
                            style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                            onClick={() => {
                              setSelectedJob(share);
                              setOnlyUnplaced(!!share.restrictions?.onlyUnplaced);
                              setActiveSubTab("approvals");
                            }}
                          >
                            Manage
                          </button>
                          <button 
                            className="remove-btn-sm" 
                            onClick={() => handleDismissShare(share.shareId)}
                            title="Remove from view"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <Briefcase size={48} color="#94a3b8" />
                <p>You haven't shared any jobs yet.</p>
                <button className="upgrade-link" onClick={() => navigate("/job-board")}>Browse Job Board to Share</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "approvals" && (
        <div className="approvals-content card">
          <div className="section-header-compact">
            <h3>Campus Recruitment Command Center</h3>
            <p>Manage eligibility and status for all your on-campus placement drives.</p>
          </div>

          {pendingJobs.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={48} color="#10b981" />
              <p>No on-campus drives found for your university.</p>
            </div>
          ) : (
            <div className="pending-jobs-list">
              {pendingJobs.map(job => (
                <div key={job._id} className="pending-job-item card">
                  <div className="job-brief">
                    <div className="company-logo-placeholder">
                      <Building2 size={24} />
                    </div>
                    <div className="job-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4>{job.jobRole}</h4>
                        <span className={`status-pill-xs ${job.status === 'active' ? 'live' : 'pending'}`}>
                          {job.status === 'active' ? 'LIVE' : 'PENDING'}
                        </span>
                      </div>
                      <p>{job.companyName} • {job.ctc || "CTC Not Specified"}</p>
                    </div>
                  </div>
                  <div className="entry-actions">
                    <button className="view-btn-sm" onClick={() => {
                      setSelectedJob(job);
                      setOnlyUnplaced(!!job.restrictions?.onlyUnplaced);
                    }}>
                      {job.status === 'active' ? 'Modify Restrictions' : 'Review & Set Eligibility'}
                    </button>
                    {job.status === 'active' && (
                      <div className="request-list-group">
                        <button 
                          className="view-btn-sm"
                          style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}
                          onClick={() => {
                            setSelectedJob(job);
                            setRequestStage("Applied");
                            setShowRequestModal(true);
                          }}
                        >
                          <Users size={14} style={{ marginRight: '6px' }} /> Request List
                        </button>
                        <div className="req-status-badges">
                          {driveRequests.filter(r => r.jobId === job._id).map((req, rid) => (
                            <div key={rid} className="req-status-wrapper">
                              <span className={`req-badge ${req.status}`}>
                                {req.requestedStage}: {req.isProactive ? "PUSHED" : req.status}
                              </span>
                              {(req.status === 'fulfilled' || req.status === 'FULFILLED') && (
                                <button 
                                  className="download-req-btn"
                                  onClick={() => handleDownloadRequestedList(req)}
                                  title="Download CSV"
                                >
                                  <Download size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {job.status === 'active' && (
                      <button 
                        className="revoke-btn-warning" 
                        onClick={() => handleRevokeDrive(job)}
                        title="Revoke Drive (move back to pending)"
                      >
                        <RotateCcw size={18} />
                      </button>
                    )}
                    <button 
                      className="revoke-btn-icon" 
                      onClick={() => handleDismissJob(job._id)}
                      title="Hide from Command Center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedJob && (
            <div className="sub-modal-overlay">
              <div className="sub-modal-content governance-modal">
                <div className="modal-header">
                  <div className="header-icon-bg"><ShieldCheck size={24} /></div>
                  <div>
                    <h2>{selectedJob.status === "active" ? "Modify Drive:" : "Review Drive:"} {selectedJob.companyName}</h2>
                    <p>{selectedJob.status === "active" ? "Update campus-specific eligibility for this live drive." : "Set campus-specific eligibility before going live."}</p>
                  </div>
                  <button className="close-btn" onClick={() => setSelectedJob(null)}><X size={20}/></button>
                </div>

                <div className="modal-body">
                  <div className="job-details-summary">
                    <div className="detail-row">
                      <span>Role:</span> <strong>{selectedJob.jobRole}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Offered CTC:</span> <strong>{selectedJob.ctc}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Category:</span> <strong>{selectedJob.category}</strong>
                    </div>
                  </div>

                  <div className="eligibility-section">
                    <h4>Campus Eligibility</h4>
                    <div className="restriction-toggle-item">
                      <div className="toggle-info">
                        <strong>Restrict to Unplaced Students Only</strong>
                        <p>If enabled, students who already hold any on-campus offer will be blocked from applying.</p>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={onlyUnplaced} 
                          onChange={(e) => setOnlyUnplaced(e.target.checked)} 
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                    <p className="governance-hint">
                      <ShieldCheck size={14} /> 
                      {selectedJob.status === "active" 
                        ? " Note: Updating restrictions will not send new notifications to students." 
                        : " Note: Individual student governance (2X Multiplier, Role restrictions) will also be automatically enforced."}
                    </p>
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="cancel-btn" onClick={() => setSelectedJob(null)}>Cancel</button>
                  <button 
                    className="confirm-btn action-btn emerald" 
                    onClick={() => handleApproveJob(selectedJob._id)}
                    disabled={approving}
                  >
                    {approving ? "Processing..." : (selectedJob.status === "active" ? "Modify & Go Live" : "Approve & Go Live")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List Request Modal */}
      {showRequestModal && selectedJob && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content governance-modal">
            <div className="modal-header">
              <div className="header-icon-bg" style={{ background: '#eff6ff' }}><Users size={24} color="#3b82f6" /></div>
              <div>
                <h2>Request Candidate List</h2>
                <p>Which candidates list do you need from <strong>{selectedJob.companyName}</strong>?</p>
              </div>
              <button className="close-btn" onClick={() => setShowRequestModal(false)}><X size={20}/></button>
            </div>

            <div className="modal-body">
              <div className="stage-selector">
                <label>Select Stage:</label>
                <div className="stage-grid">
                  {["Applied", "Shortlisted", "Interview", "Hired"].map(stage => (
                    <button 
                      key={stage}
                      className={`stage-btn ${requestStage === stage ? 'active' : ''}`}
                      onClick={() => setRequestStage(stage)}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
                <p className="governance-hint" style={{ marginTop: '16px' }}>
                  <AlertTriangle size={14} /> 
                  HR will receive this request and can fulfill it by sharing the current list of candidates in the selected stage.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowRequestModal(false)}>Cancel</button>
              <button 
                className="confirm-btn action-btn blue" 
                onClick={handleRequestListData}
                disabled={requesting}
              >
                {requesting ? "Sending..." : "Send Request to HR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "governance" && (
        <div className="governance-tab-content">
          <div className="governance-header card">
            <div className="g-title">
              <ShieldCheck size={32} color="#3b82f6" />
              <div>
                <h3>Campus-Wide Recruitment Policies</h3>
                <p>Set global rules that apply to all students in your university automatically.</p>
              </div>
            </div>
            <button 
              className="save-settings-btn" 
              onClick={handleUpdateSettings}
              disabled={savingSettings || currentUser.reliabilityStatus === "suspended"}
            >
              <Save size={18} /> {savingSettings ? "Saving..." : "Save Policies"}
            </button>
          </div>

          <div className="settings-grid">
            <div className="setting-card card">
              <div className="s-info">
                <h4>2X Multiplier Policy</h4>
                <p>When enabled, students who get an offer will automatically be restricted from applying to further drives unless the new offer is at least X times their current package.</p>
              </div>
              <div className="s-control">
                <div className="control-row">
                  <label>Auto-apply multiplier upon placement?</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={settings.autoApplyMultiplier} 
                      onChange={(e) => setSettings({...settings, autoApplyMultiplier: e.target.checked})} 
                      disabled={currentUser.reliabilityStatus === "suspended"}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <div className="control-row">
                  <label>Global Multiplier Value</label>
                  <div className="multiplier-input">
                    <input 
                      type="number" 
                      step="0.1" 
                      min="1"
                      value={settings.globalMultiplierValue} 
                      onChange={(e) => setSettings({...settings, globalMultiplierValue: parseFloat(e.target.value)})} 
                      disabled={currentUser.reliabilityStatus === "suspended"}
                    />
                    <span>X</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="setting-card card">
              <div className="s-info">
                <h4>Global Branch Restrictions</h4>
                <p>Set specific allowed roles for entire branches (e.g. CSE students only for Software roles).</p>
              </div>
              <div className="s-control">
                <div className="branch-rules-list">
                  {settings.branchRestrictions?.map((rule, idx) => (
                    <div key={idx} className="branch-rule-item">
                      <div className="rule-details">
                        <strong>{rule.branch}</strong>
                        <span>Allowed: {rule.allowedRoles.join(", ")}</span>
                      </div>
                      <button 
                        className="remove-btn-sm" 
                        onClick={() => handleRemoveBranchRule(idx)}
                        disabled={currentUser.reliabilityStatus === "suspended"}
                      ><X size={14}/></button>
                    </div>
                  ))}
                </div>
                <div className="add-branch-rule">
                  <input 
                    placeholder="Branch (e.g. CSE)" 
                    value={newBranchRule.branch}
                    onChange={(e) => setNewBranchRule({...newBranchRule, branch: e.target.value})}
                    disabled={currentUser.reliabilityStatus === "suspended"}
                  />
                  <input 
                    placeholder="Allowed Roles (e.g. SDE, Frontend)" 
                    value={newBranchRule.allowedRoles}
                    onChange={(e) => setNewBranchRule({...newBranchRule, allowedRoles: e.target.value})}
                    disabled={currentUser.reliabilityStatus === "suspended"}
                  />
                  <button 
                    className="add-rule-btn" 
                    onClick={handleAddBranchRule}
                    disabled={currentUser.reliabilityStatus === "suspended"}
                  >Add Policy</button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="global-reset-section">
            <div className="reset-card card">
              <div className="s-info">
                <h4><RotateCcw size={20} /> Campus Maintenance: New Season Setup</h4>
                <p>Prepare for a new placement season by resetting all student statuses and clearing sharing history. Academic records and technical evaluations are preserved.</p>
              </div>
              <button 
                className="danger-btn"
                onClick={() => { setShowResetModal(true); setResetConfirmText(""); }}
                disabled={currentUser.reliabilityStatus === "suspended"}
              >
                <TrendingUp size={18} /> Start New Placement Season
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "profile" && (
        <ProfileSettings user={currentUser} onUpdate={fetchPOData} />
      )}

      {activeSubTab === "branchApprovals" && (
        <div className="branch-approvals-content card">
          <div className="shares-header">
            <h3>Student Branch Change Requests</h3>
            <p>Review and approve branch/specialization updates requested by Business Tier students.</p>
          </div>

          <div className="branch-requests-list">
            {branchRequests.length > 0 ? (
              <table className="hired-students-table">
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>CURRENT BRANCH</th>
                    <th>REQUESTED BRANCH</th>
                    <th>SPECIALIZATION</th>
                    <th>PROOF</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {branchRequests.map((req) => (
                    <tr key={req._id}>
                      <td>
                        <div className="s-cell">
                          <img src={req.img || "/images/noavatar.png"} alt="" />
                          <span>{req.username}</span>
                        </div>
                      </td>
                      <td>{req.branch || "Not Set"}</td>
                      <td><strong>{req.branchChangeRequest.requestedBranch}</strong></td>
                      <td>{req.branchChangeRequest.requestedSpecialization || "N/A"}</td>
                      <td>
                        {req.branchChangeRequest.proof ? (
                          <a href={req.branchChangeRequest.proof} target="_blank" rel="noreferrer" className="view-btn-sm" style={{textDecoration: 'none', display: 'inline-block'}}>View Proof</a>
                        ) : "No Proof"}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="confirm-btn action-btn emerald" 
                            style={{padding: '6px 12px', fontSize: '0.85rem'}}
                            onClick={() => handleBranchDecision(req._id, "approve")}
                            disabled={processingBranch === req._id}
                          >
                            Approve
                          </button>
                          <button 
                            className="revoke-btn-warning" 
                            style={{padding: '6px 12px', fontSize: '0.85rem', color: '#ef4444', border: '1px solid #ef4444', background: 'transparent'}}
                            onClick={() => setRejectionModal({ show: true, studentId: req._id, reason: "" })}
                            disabled={processingBranch === req._id}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <ShieldCheck size={48} color="#94a3b8" />
                <p>No pending branch change requests.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ Branch Request Rejection Modal ══ */}
      {rejectionModal.show && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content governance-modal">
            <div className="modal-header">
              <div className="header-icon-bg" style={{background: '#fee2e2', color: '#ef4444'}}><AlertTriangle size={24} /></div>
              <div>
                <h2>Reject Branch Request</h2>
                <p>Please provide a reason for rejecting this request.</p>
              </div>
              <button className="close-btn" onClick={() => setRejectionModal({ show: false, studentId: "", reason: "" })}><X size={20}/></button>
            </div>
            <div className="modal-body">
              <textarea 
                placeholder="Enter rejection reason..."
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal({...rejectionModal, reason: e.target.value})}
                style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', minHeight: '100px', fontFamily: 'inherit'}}
              />
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setRejectionModal({ show: false, studentId: "", reason: "" })}>Cancel</button>
              <button 
                className="confirm-btn" 
                style={{
                  background: '#ef4444', 
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onClick={() => handleBranchDecision(rejectionModal.studentId, "reject", rejectionModal.reason)}
                disabled={!rejectionModal.reason || processingBranch === rejectionModal.studentId}
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Global Reset Multi-step Confirmation Modal ══ */}
      {showResetModal && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content governance-modal reset-modal-content">
            <div className="modal-header" style={{ borderBottom: '1px solid #fee2e2' }}>
              <div className="header-icon-bg" style={{ background: '#fee2e2', color: '#ef4444' }}><AlertTriangle size={24} /></div>
              <div>
                <h2 style={{ color: '#991b1b' }}>Placement Season Reset</h2>
                <p>Verify university credentials to authorize global reset.</p>
              </div>
              <button className="close-btn" onClick={() => setShowResetModal(false)}><X size={20}/></button>
            </div>

            <div className="modal-body">
              <div className="reset-warning-box">
                <ShieldCheck size={32} color="#10b981" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Data to be Preserved:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '0.9rem', color: '#065f46' }}>
                    <li>Student Technical Records & ATS Scores</li>
                    <li>Verified Identification & Documents</li>
                    <li>Professional Profiles & Descriptions</li>
                    <li>Outreach History & Collaborations</li>
                  </ul>
                </div>
              </div>

              <div className="reset-warning-box" style={{ background: '#fee2e2', border: '1px solid #fecaca' }}>
                <Trash2 size={32} color="#ef4444" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#991b1b' }}>Data to be Cleared:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '0.9rem', color: '#991b1b' }}>
                    <li>All Student Placement Statuses (Reset to Unplaced)</li>
                    <li>On-Campus Offer History & CTC Records</li>
                    <li>University Job Board Sharing History</li>
                    <li>Student/PO UI Dismissal Preferences</li>
                  </ul>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '24px' }}>
                <label style={{ color: '#475569', fontWeight: 600 }}>Manual Authorization Required</label>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>
                  Please type <strong>{currentUser?.university}</strong> to authorize this reset.
                </p>
                <input 
                  type="text" 
                  placeholder="Enter university name exactly"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
                    border: resetConfirmText === currentUser?.university ? '2px solid #10b981' : '1px solid #cbd5e1',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div className="reset-footer">
              <button className="cancel-btn" onClick={() => setShowResetModal(false)}>Cancel</button>
              <button 
                className="confirm-reset-btn" 
                style={{ 
                  background: resetConfirmText === currentUser?.university ? '#991b1b' : '#94a3b8',
                  cursor: resetConfirmText === currentUser?.university ? 'pointer' : 'not-allowed'
                }}
                onClick={handleGlobalReset}
                disabled={resetting || resetConfirmText !== currentUser?.university}
              >
                {resetting ? "Resetting Campus..." : "AUTHORIZE & RESET SEASON"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PODashboard;

