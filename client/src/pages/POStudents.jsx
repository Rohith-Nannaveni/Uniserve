import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";
import { 
  Search, 
  Filter, 
  Download, 
  MessageSquare, 
  ArrowLeft,
  UserCheck,
  GraduationCap,
  ShieldCheck,
  Save,
  X,
  Lock,
  IndianRupee,
  Briefcase,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Users,
  RotateCcw,
  Edit3
} from "lucide-react";
import "./POStudents.css";

const POStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // Re-addition requests from removed students
  const [readdRequests, setReaddRequests] = useState([]);
  const [processingReadd, setProcessingReadd] = useState(null); // studentId being processed

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Governance Modal State
  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [governanceData, setGovernanceData] = useState({
    multiplier: 0,
    allowedRoles: "",
    allowedCategories: [],
    isLocked: false,
    branch: "",
    specialization: ""
  });
  const [savingGovernance, setSavingGovernance] = useState(false);

  // Status Management State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusFormData, setStatusFormData] = useState({
    status: "unplaced",
    company: "",
    role: "",
    packageAmount: "",
    offerType: "Full Time"
  });
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const [studentsRes, readdRes] = await Promise.all([
        newRequest.get("/po/students"),
        newRequest.get("/po/readd-requests")
      ]);
      setStudents(studentsRes.data || []);
      setFilteredStudents(studentsRes.data || []);
      setReaddRequests(readdRes.data || []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    let result = students;
    if (searchTerm) {
      result = result.filter(s =>
        (s.username || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (tierFilter !== "all") {
      result = result.filter(s => s.subscription === tierFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter(s =>
        (s.placementStatus?.toLowerCase() || "").replace(/\s+/g, "-") === statusFilter
      );
    }
    setFilteredStudents(result);
  }, [searchTerm, tierFilter, statusFilter, students]);

  const handleReaddDecision = async (studentId, action) => {
    setProcessingReadd(studentId);
    try {
      await newRequest.patch(`/po/readd/${studentId}`, { action });
      fetchStudents(); // refresh both lists
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Action failed.");
    } finally {
      setProcessingReadd(null);
    }
  };

  // ── Selection helpers ─────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isAllSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every(s => selectedIds.has(s._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s._id)));
    }
  };

  // ── Delete handlers ───────────────────────────────────────────────────
  const promptDelete = (student) => {
    setDeleteTarget({ type: "single", student });
    setShowDeleteModal(true);
  };

  const promptBulkDelete = () => {
    setDeleteTarget({ type: "bulk" });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteTarget.type === "single") {
        await newRequest.delete(`/po/students/${deleteTarget.student._id}`);
      } else {
        await newRequest.delete("/po/students/bulk", {
          data: { studentIds: Array.from(selectedIds) }
        });
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Other handlers ────────────────────────────────────────────────────
  const handleToggleRecommendation = async (studentId) => {
    try {
      await newRequest.put(`/po/recommend/${studentId}`);
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMessageUser = async (userId) => {
    try {
      const res = await newRequest.post("/conversations", { to: userId });
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenGovernance = (student) => {
    setSelectedStudent(student);
    setGovernanceData({
      multiplier: student.governance?.multiplier || 0,
      allowedRoles: student.governance?.allowedRoles?.join(", ") || "",
      allowedCategories: student.governance?.allowedCategories || [],
      isLocked: !!student.governance?.isLocked,
      branch: student.branch || "",
      specialization: student.specialization || ""
    });
    setShowGovernanceModal(true);
  };

  const handleSaveGovernance = async () => {
    if (!selectedStudent) return;
    setSavingGovernance(true);
    try {
      const payload = {
        ...governanceData,
        allowedRoles: governanceData.allowedRoles.split(",").map(s => s.trim()).filter(s => s !== ""),
        branch: governanceData.branch,
        specialization: governanceData.specialization
      };
      await newRequest.put(`/po/governance/${selectedStudent._id}`, payload);
      setShowGovernanceModal(false);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Failed to update governance settings.");
    } finally {
      setSavingGovernance(false);
    }
  };

  const handleOpenStatusModal = (student) => {
    setSelectedStudent(student);
    setStatusFormData({
      status: student.placementStatus?.toLowerCase() || "unplaced",
      company: student.onCampusCompany || "",
      role: student.onCampusJobRole || "",
      packageAmount: student.currentHighestOnCampusOffer || "",
      offerType: student.onCampusOfferType || "Full Time"
    });
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedStudent) return;
    setSavingStatus(true);
    try {
      await newRequest.patch(`/po/students/${selectedStudent._id}/placement-status`, statusFormData);
      setShowStatusModal(false);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update student status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleQuickResetStatus = async (studentId) => {
    if (!window.confirm("Are you sure you want to reset this student's placement status to UNPLACED? All offer details will be cleared.")) return;
    try {
      await newRequest.patch(`/po/students/${studentId}/placement-status`, { status: "unplaced" });
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert("Failed to reset student status.");
    }
  };

  const exportToCSV = () => {
    const headers = ["Username", "Branch", "Subscription", "ATS Score", "Placement Status", "Placement Track", "Recommendation"];
    const csvData = filteredStudents.map(s => [
      s.username,
      s.branch || "N/A",
      (s.subscription || "normal").toUpperCase(),
      s.resumeData?.atsScore || "N/A",
      s.placementStatus,
      s.track,
      s.isRecommended ? "Recommended" : "None"
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `student_directory_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="loading-state">Loading Student Directory...</div>;

  return (
    <div className="po-students-page">
      <div className="container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <div className="header-main">
            <h1><GraduationCap size={32} color="#3b82f6" /> Student Directory</h1>
            <p>Manage and track the progress of all students in your university.</p>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="controls-box card">
          <div className="search-bar">
            <Search size={18} className="icon" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            {/* Tier filter — Normal removed */}
            <div className="filter-item">
              <Filter size={18} />
              <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
                <option value="all">All Tiers</option>
                <option value="business">Business Tier</option>
                <option value="premium">Premium Tier</option>
              </select>
            </div>

            {/* Status filter — NEW */}
            <div className="filter-item">
              <Filter size={18} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="unplaced">Unplaced</option>
                <option value="placed">Placed</option>
                <option value="career-growth">Career Growth</option>
              </select>
            </div>

            <button className="export-btn" onClick={exportToCSV}>
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {/* ── Re-addition Requests Panel ── */}
        {readdRequests.length > 0 && (
          <div className="readd-requests-panel card">
            <div className="readd-requests-header">
              <span className="readd-requests-title">
                <AlertTriangle size={18} color="#d97706" />
                Re-addition Requests ({readdRequests.length})
              </span>
              <span className="readd-hint">These students were removed and have requested to be re-added to your directory.</span>
            </div>
            <div className="readd-requests-list">
              {readdRequests.map(s => (
                <div key={s._id} className="readd-request-item">
                  <div className="readd-student-info">
                    <img src={s.img || "/images/noavatar.png"} alt="" />
                    <div>
                      <strong>{s.username}</strong>
                      <span>{s.branch || "No branch"} · {(s.subscription || "normal").toUpperCase()}</span>
                    </div>
                  </div>
                  {s.poRemovalNotification?.readdRequestMessage && (
                    <div className="readd-request-message">
                      "{s.poRemovalNotification.readdRequestMessage}"
                    </div>
                  )}
                  <div className="readd-request-actions">
                    <button
                      className="readd-approve-btn"
                      onClick={() => handleReaddDecision(s._id, "approve")}
                      disabled={processingReadd === s._id}
                    >
                      ✓ {processingReadd === s._id ? "Processing..." : "Re-add"}
                    </button>
                    <button
                      className="readd-decline-btn"
                      onClick={() => handleReaddDecision(s._id, "decline")}
                      disabled={processingReadd === s._id}
                    >
                      ✕ Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Bulk Action Bar — appears when students are selected ── */}
        {selectedIds.size > 0 && (
          <div className="bulk-action-bar">
            <span className="bulk-count">
              <CheckSquare size={18} /> {selectedIds.size} student{selectedIds.size > 1 ? "s" : ""} selected
            </span>
            <button className="bulk-delete-btn" onClick={promptBulkDelete}>
              <Trash2 size={16} /> Delete Selected
            </button>
            <button className="bulk-clear-btn" onClick={() => setSelectedIds(new Set())}>
              <X size={16} /> Clear Selection
            </button>
          </div>
        )}

        {/* ── Table ── */}
        <div className="students-table-container card">
          <table>
            <thead>
              <tr>
                {/* Select All checkbox */}
                <th className="checkbox-col">
                  <button
                    className={`select-all-btn ${isAllSelected ? "checked" : ""}`}
                    onClick={toggleSelectAll}
                    title={isAllSelected ? "Deselect all" : "Select all"}
                  >
                    {isAllSelected
                      ? <CheckSquare size={18} color="#3b82f6" />
                      : <Square size={18} color="#94a3b8" />
                    }
                  </button>
                </th>
                <th>STUDENT</th>
                <th>TIER</th>
                <th>ATS SCORE</th>
                <th>PLACEMENT TRACK</th>
                <th>STATUS</th>
                <th>ENDORSEMENT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? filteredStudents.map(s => (
                <tr key={s._id} className={selectedIds.has(s._id) ? "row-selected" : ""}>
                  {/* Per-row checkbox */}
                  <td className="checkbox-col">
                    <button
                      className={`row-checkbox ${selectedIds.has(s._id) ? "checked" : ""}`}
                      onClick={() => toggleSelect(s._id)}
                    >
                      {selectedIds.has(s._id)
                        ? <CheckSquare size={17} color="#3b82f6" />
                        : <Square size={17} color="#94a3b8" />
                      }
                    </button>
                  </td>
                  <td>
                    <div className="student-cell">
                      <img src={s.img || "/images/noavatar.png"} alt="" />
                      <span>{s.username}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`tier-pill ${s.subscription || "normal"}`}>
                      {(s.subscription || "normal").toUpperCase()}
                    </span>
                  </td>
                  <td>{s.resumeData?.atsScore || "N/A"}</td>
                  <td>
                    <span className={`track-pill ${s.subscription === "business" ? "placement" : "skill"}`}>
                      {s.track}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${(s.placementStatus || "").toLowerCase().replace(/\s+/g, "-")}`}>
                      {s.placementStatus || "Unplaced"}
                    </span>
                    {s.subscription !== "premium" && (
                      <div className="status-controls">
                        <button 
                          className="status-edit-btn" 
                          onClick={() => handleOpenStatusModal(s)}
                          title="Update Student Status"
                        >
                          <Edit3 size={12} />
                        </button>
                        {s.placementStatus === "Placed" && (
                          <button 
                            className="status-reset-btn" 
                            onClick={() => handleQuickResetStatus(s._id)}
                            title="Reset to Unplaced"
                          >
                            <RotateCcw size={12} />
                          </button>
                        )}
                      </div>
                    )}
                    {s.governance?.isLocked && <Lock size={14} color="#ef4444" style={{ marginLeft: "5px" }} title="Student is locked from placements" />}
                    {s.governance?.multiplier > 0 && <span className="governance-badge" title={`${s.governance.multiplier}X Multiplier active`}>{s.governance.multiplier}X</span>}
                  </td>
                  <td>
                    {s.subscription === "business" ? (
                      <div className="po-controls">
                        <button
                          className={`recommend-btn ${s.isRecommended ? "active" : ""}`}
                          onClick={() => handleToggleRecommendation(s._id)}
                          title={currentUser?.reliabilityStatus === "suspended" ? "Your account is suspended" : s.isRecommended ? "Click to remove endorsement" : "Endorse this student for placements"}
                          disabled={currentUser?.reliabilityStatus === "suspended"}
                        >
                          <UserCheck size={16} /> {s.isRecommended ? "Remove Endorsement" : "Endorse Student"}
                        </button>
                        <button
                          className="governance-trigger-btn"
                          onClick={() => handleOpenGovernance(s)}
                          title={currentUser?.reliabilityStatus === "suspended" ? "Your account is suspended" : "Manage Eligibility & Restrictions"}
                          disabled={currentUser?.reliabilityStatus === "suspended"}
                        >
                          <ShieldCheck size={16} /> Eligibility
                        </button>
                      </div>
                    ) : (
                      <span className="not-applicable" title="Endorsements are exclusive to Business Tier">N/A</span>
                    )}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="msg-btn" onClick={() => handleMessageUser(s._id)}>
                        <MessageSquare size={16} /> Message
                      </button>
                      <button
                        className="delete-student-btn"
                        onClick={() => promptDelete(s)}
                        title="Remove from placement directory"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8">
                    <div className="no-students-found">
                      <div className="no-students-content">
                        <Users size={40} />
                        <p>No students found matching your filters.</p>
                        {(searchTerm || tierFilter !== "all" || statusFilter !== "all") && (
                          <button 
                            className="clear-filters-btn"
                            onClick={() => {
                              setSearchTerm("");
                              setTierFilter("all");
                              setStatusFilter("all");
                            }}
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ Delete Confirmation Modal ══ */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal card">
            <div className="delete-modal-icon">
              <AlertTriangle size={40} color="#ef4444" />
            </div>
            <h3>
              {deleteTarget?.type === "single"
                ? `Remove ${deleteTarget.student?.username}?`
                : `Remove ${selectedIds.size} selected student${selectedIds.size > 1 ? "s" : ""}?`
              }
            </h3>
            <p>
              {deleteTarget?.type === "single"
                ? "This student will be removed from the placement directory. Their account will remain intact, but they will no longer appear in your student list."
                : `All ${selectedIds.size} selected students will be removed from the placement directory. Their accounts remain intact.`
              }
            </p>
            <div className="delete-modal-actions">
              <button
                className="cancel-btn"
                onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={confirmDelete}
                disabled={deleting}
              >
                <Trash2 size={16} /> {deleting ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Governance Modal ══ */}
      {showGovernanceModal && (
        <div className="modal-overlay">
          <div className="governance-modal card">
            <div className="modal-header">
              <h3><ShieldCheck size={24} color="#3b82f6" /> Manage Eligibility: {selectedStudent?.username}</h3>
            </div>

            <div className="modal-body">
              <div className="governance-section">
                <div className="section-label">
                  <GraduationCap size={18} />
                  <span>Academic Branch</span>
                </div>
                <div className="form-group">
                  <label>Student Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE, ECE, Mechanical"
                    value={governanceData.branch}
                    onChange={(e) => setGovernanceData({ ...governanceData, branch: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label>Specialization (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. AI, Data Science"
                    value={governanceData.specialization}
                    onChange={(e) => setGovernanceData({ ...governanceData, specialization: e.target.value })}
                  />
                  <small>Needed for Global Branch Restrictions in Governance policies.</small>
                </div>
              </div>

              <div className="governance-section">
                <div className="section-label">
                  <Lock size={18} />
                  <span>Access Control</span>
                </div>
                <div className="form-group">
                  <div className="form-checkbox">
                    <input
                      type="checkbox"
                      id="isLocked"
                      checked={governanceData.isLocked}
                      onChange={(e) => setGovernanceData({ ...governanceData, isLocked: e.target.checked })}
                    />
                    <label htmlFor="isLocked">
                      <strong>Lock Placement Access</strong>
                      <p>Student will be barred from applying to all on-campus drives regardless of eligibility.</p>
                    </label>
                  </div>
                </div>
              </div>

              <div className="governance-section">
                <div className="section-label">
                  <IndianRupee size={18} />
                  <span>Package Multiplier (2X/3X Policy)</span>
                </div>
                <div className="multiplier-control">
                  <label>Required Multiplier for next offer</label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={governanceData.multiplier}
                      onChange={(e) => setGovernanceData({ ...governanceData, multiplier: parseFloat(e.target.value) })}
                    />
                    <span>X</span>
                  </div>
                </div>
                <p className="helper-text">If student has a 6 LPA offer, setting 2X means they can only apply for jobs offering ≥ 12 LPA.</p>
              </div>

              <div className="governance-section">
                <div className="section-label">
                  <Briefcase size={18} />
                  <span>Role & Category Restrictions</span>
                </div>
                <div className="form-group">
                  <label>Allowed Job Roles (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. SDE, Frontend, Data Analyst"
                    value={governanceData.allowedRoles}
                    onChange={(e) => setGovernanceData({ ...governanceData, allowedRoles: e.target.value })}
                  />
                  <small>Empty means student can apply for any role.</small>
                </div>

                <div className="category-toggles">
                  <label>Allowed Employment Types</label>
                  <div className="checkbox-grid">
                    {["Full Time", "Regular Internship", "Internship + PPO", "Contract"].map(cat => (
                      <div key={cat} className="form-checkbox">
                        <input
                          type="checkbox"
                          id={`cat-${cat}`}
                          checked={governanceData.allowedCategories.includes(cat)}
                          onChange={(e) => {
                            const newCats = e.target.checked
                              ? [...governanceData.allowedCategories, cat]
                              : governanceData.allowedCategories.filter(c => c !== cat);
                            setGovernanceData({ ...governanceData, allowedCategories: newCats });
                          }}
                        />
                        <label htmlFor={`cat-${cat}`}>{cat}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowGovernanceModal(false)}>Cancel</button>
              <button
                className="save-btn"
                onClick={handleSaveGovernance}
                disabled={savingGovernance || currentUser?.reliabilityStatus === "suspended"}
              >
                <Save size={18} /> {savingGovernance ? "Applying..." : "Apply Restrictions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Status Management Modal ══ */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="governance-modal status-modal card">
            <div className="modal-header">
              <h3><Edit3 size={24} color="#3b82f6" /> Manage Status: {selectedStudent?.username}</h3>
              <button className="close-btn" onClick={() => setShowStatusModal(false)}><X size={20} /></button>
            </div>

            <div className="modal-body">
              <div className="governance-section">
                <div className="section-label">Placement Status</div>
                <div className="status-option-grid">
                  <div 
                    className={`status-option ${statusFormData.status === "unplaced" ? "active" : ""}`}
                    onClick={() => setStatusFormData({ ...statusFormData, status: "unplaced" })}
                  >
                    <RotateCcw size={24} />
                    <span>UNPLACED</span>
                  </div>
                  <div 
                    className={`status-option ${statusFormData.status === "placed" ? "active" : ""}`}
                    onClick={() => setStatusFormData({ ...statusFormData, status: "placed" })}
                  >
                    <UserCheck size={24} />
                    <span>PLACED</span>
                  </div>
                </div>

                {statusFormData.status === "placed" && (
                  <div className="placement-details-form">
                    <h4>Placement Offer Details</h4>
                    <div className="form-group" style={{ marginBottom: "15px" }}>
                      <label>Company Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Google, Microsoft"
                        value={statusFormData.company}
                        onChange={(e) => setStatusFormData({ ...statusFormData, company: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Job Role</label>
                        <input 
                          type="text" 
                          placeholder="e.g. SDE-1"
                          value={statusFormData.role}
                          onChange={(e) => setStatusFormData({ ...statusFormData, role: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Package (LPA)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          placeholder="e.g. 12"
                          value={statusFormData.packageAmount}
                          onChange={(e) => setStatusFormData({ ...statusFormData, packageAmount: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Offer Type</label>
                      <select 
                        value={statusFormData.offerType}
                        onChange={(e) => setStatusFormData({ ...statusFormData, offerType: e.target.value })}
                        className="form-control"
                        style={{ padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                      >
                        <option value="Full Time">Full Time</option>
                        <option value="Regular Internship">Regular Internship</option>
                        <option value="Internship + PPO">Internship + PPO</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>
                    <p className="helper-text">
                      Setting a student as PLACED manually will automatically apply 2X Multipliers if the university has that global policy enabled.
                    </p>
                  </div>
                )}

                {statusFormData.status === "unplaced" && (
                  <p className="helper-text" style={{ textAlign: "center", color: "#ef4444" }}>
                    Warning: Changing status to UNPLACED will permanently clear all existing placement data for this student.
                  </p>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ padding: "20px 30px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button className="cancel-btn" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button
                className="save-btn"
                onClick={handleUpdateStatus}
                disabled={savingStatus || (statusFormData.status === "placed" && (!statusFormData.company || !statusFormData.role || !statusFormData.packageAmount))}
                style={{ background: "#3b82f6", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {savingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POStudents;
