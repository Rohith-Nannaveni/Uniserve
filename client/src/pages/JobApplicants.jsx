import React, { useEffect, useState } from "react";
import "./JobApplicants.css";
import { useParams, useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";
import moment from "moment";
import { MessageSquare, Save, Download, AlertCircle, CheckCircle2, Share2, X } from "lucide-react";

const JobApplicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [recruitmentNotes, setRecruitmentNotes] = useState({}); // { appId: note }

  const [filters, setFilters] = useState({
    minCgpa: "",
    skill: "",
    minAts: "",
  });

  const [bulkStatus, setBulkStatus] = useState("shortlisted");
  const [bulkMessage, setBulkMessage] = useState("");

  const [poRequests, setPORequests] = useState([]);
  const [fulfilling, setFulfilling] = useState(null);
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushStage, setPushStage] = useState("Applied");
  const [pushing, setPushing] = useState(false);

  const fetchApplicants = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const [appRes, jobRes, reqRes] = await Promise.all([
        newRequest.get(`/applications/applicants/${jobId}?${queryParams}`),
        newRequest.get(`/jobs/${jobId}`),
        newRequest.get(`/hr/drive-requests/${jobId}`)
      ]);
      setApplicants(appRes.data);
      setJob(jobRes.data);
      setPORequests(reqRes.data || []);
      
      // Initialize notes
      const notes = {};
      appRes.data.forEach(app => {
        notes[app._id] = app.recruitmentDetails || "";
      });
      setRecruitmentNotes(notes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    setLoading(true);
    fetchApplicants();
  };

  const handleFulfillRequest = async (request) => {
    setFulfilling(request._id);
    try {
      await newRequest.patch(`/hr/fulfill-request/${request._id}`);
      alert(`The ${request.requestedStage} list has been shared with the Placement Office!`);
      // Update local state
      setPORequests(poRequests.map(r => r._id === request._id ? { ...r, status: 'fulfilled' } : r));
    } catch (err) {
      alert("Failed to fulfill request.");
    } finally {
      setFulfilling(null);
    }
  };

  const handlePushDataToPO = async () => {
    setPushing(true);
    try {
      await newRequest.post("/hr/push-data", { jobId, requestedStage: pushStage });
      alert(`The ${pushStage} list has been shared with the Placement Office!`);
      setShowPushModal(false);
      // Refresh requests to show in fulfilled log
      const reqRes = await newRequest.get(`/hr/drive-requests/${jobId}`);
      setPORequests(reqRes.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to share list.");
    } finally {
      setPushing(false);
    }
  };

  const exportCurrentStageToCSV = (stageName = "All_Applicants") => {
    const stageMap = {
      "Applied": "pending",
      "Shortlisted": "shortlisted",
      "Interview": "interview",
      "Hired": "hired"
    };

    let targetStatus = stageMap[stageName] || null;
    let listToExport = targetStatus 
      ? applicants.filter(a => a.status === targetStatus)
      : applicants;

    if (listToExport.length === 0) {
      return alert(`No candidates found in the ${stageName} stage.`);
    }

    const headers = ["Name", "Email", "Branch", "CGPA", "ATS Score", "Skills", "Stage Info", "Offer Details"];
    const csvData = listToExport.map(app => [
      app.studentId?.username || "N/A",
      app.studentId?.email || "N/A",
      app.studentId?.branch || "N/A",
      app.submittedCgpa || "N/A",
      app.atsScore || 0,
      `"${(app.submittedSkills || []).join(', ')}"`,
      app.status.toUpperCase(),
      `Package: ${job?.ctc || app.offeredPackage || 'N/A'}, Type: ${app.offerType || job?.category || 'N/A'}`
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${job.companyName}_${stageName}_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateStatus = async (appId, status) => {
    if (!window.confirm(`Are you sure you want to mark this candidate as ${status}?`)) return;

    try {
      await newRequest.put(`/applications/${appId}/status`, { status });
      setApplicants(applicants.map(app => app._id === appId ? { ...app, status } : app));
      alert(`Candidate marked as ${status}!`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const saveRecruitmentDetails = async (appId) => {
    try {
      await newRequest.put(`/applications/${appId}/status`, { 
        recruitmentDetails: recruitmentNotes[appId] 
      });
      alert("Recruitment details saved!");
    } catch (err) {
      alert("Failed to save details");
    }
  };

  const handleNoteChange = (appId, val) => {
    setRecruitmentNotes({ ...recruitmentNotes, [appId]: val });
  };

  const handleMessageCandidate = async (studentId) => {
    try {
      const res = await newRequest.post("/conversations", { to: studentId });
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      alert("Failed to initiate chat");
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkMessage.trim()) return alert("Please enter a message!");
    
    const confirmMsg = `This will send this message to ALL candidates with status "${bulkStatus}". Proceed?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await newRequest.post("/applications/bulk-update-details", {
        jobId,
        status: bulkStatus,
        recruitmentDetails: bulkMessage
      });
      alert("Bulk update successful!");
      fetchApplicants();
      setBulkMessage("");
    } catch (err) {
      alert(err.response?.data?.message || "Bulk update failed");
    }
  };

  if (loading && !applicants.length) return <div className="loader">Loading...</div>;

  return (
    <div className="job-applicants">
      <div className="container">
        <div className="header">
          <div>
            <h1>Applicants for {job?.jobRole}</h1>
            <p>{job?.companyName}</p>
          </div>
          <div className="header-actions">
            <button className="export-all-btn" onClick={() => exportCurrentStageToCSV("All_Applicants")}>
              <Download size={18} /> Export All CSV
            </button>
            {job?.isOnCampus && (
              <button className="share-po-btn" onClick={() => setShowPushModal(true)}>
                <Share2 size={18} /> Share List with PO
              </button>
            )}
          </div>
        </div>

        {/* PO Request Notifications */}
        {poRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="po-requests-banner card">
            <div className="banner-title">
              <AlertCircle size={20} color="#3b82f6" />
              <h3>Placement Office Requests</h3>
            </div>
            <div className="requests-list">
              {poRequests.filter(r => r.status === 'pending').map(req => (
                <div key={req._id} className="req-item">
                  <p>The Placement Office has requested the <strong>{req.requestedStage}</strong> list.</p>
                  <div className="req-actions">
                    <button className="export-outline-btn" onClick={() => exportCurrentStageToCSV(req.requestedStage)}>
                      <Download size={16} /> Preview CSV
                    </button>
                    <button 
                      className="fulfill-btn" 
                      onClick={() => handleFulfillRequest(req)}
                      disabled={fulfilling === req._id}
                    >
                      {fulfilling === req._id ? "Sharing..." : "Fulfill & Share"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {poRequests.filter(r => r.status === 'fulfilled').length > 0 && (
          <div className="fulfilled-requests-log card">
            <div className="log-header">
              <CheckCircle2 size={18} color="#10b981" />
              <span>Shared with PO:</span>
            </div>
            <div className="badges-row">
              {poRequests.filter(r => r.status === 'fulfilled').map(req => (
                <span key={req._id} className="fulfilled-badge">
                  {req.requestedStage} List ({moment(req.fulfilledAt).format("MMM DD")})
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="filter-panel">
          <h3>Filter Candidates</h3>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Min CGPA</label>
              <input type="number" step="0.1" name="minCgpa" value={filters.minCgpa} onChange={handleFilterChange} placeholder="e.g. 8.0" />
            </div>
            <div className="filter-group">
              <label>Skill Keyword</label>
              <input type="text" name="skill" value={filters.skill} onChange={handleFilterChange} placeholder="e.g. React" />
            </div>
            <div className="filter-group">
              <label>Min ATS Score</label>
              <input type="number" name="minAts" value={filters.minAts} onChange={handleFilterChange} placeholder="e.g. 70" />
            </div>
            <button className="apply-filters-btn" onClick={applyFilters}>Apply Filters</button>
          </div>
        </div>

        <div className="bulk-update-panel">
          <h3>Bulk Announcement</h3>
          <p>Send a common message (test link, interview schedule, etc.) to all candidates in a specific stage.</p>
          <div className="bulk-grid">
            <div className="filter-group">
              <label>Target Status</label>
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="hired">Hired</option>
              </select>
            </div>
            <div className="filter-group full-width">
              <label>Message / Details</label>
              <textarea 
                placeholder="Enter common message for selected candidates..."
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
              />
            </div>
            <button className="bulk-send-btn" onClick={handleBulkUpdate}>
              Send to All {bulkStatus} Candidates
            </button>
          </div>
        </div>

        <div className="applicants-list">
          <div className="list-stats">
            Found {applicants.length} matching candidates
          </div>
          
          {applicants.length === 0 ? (
            <div className="no-applicants">No candidates matching your criteria.</div>
          ) : (
            <div className="applicant-grid">
              {applicants.map((app) => (
                <div key={app._id} className="applicant-card">
                  <div className="card-top">
                    <img src={app.studentId?.img || "/images/defaults/profile-default-ai.png"} alt={app.studentId?.username} />
                    <div className="student-info">
                      <h4>{app.studentId?.username}</h4>
                      <span>{app.studentId?.university}</span>
                    </div>
                    <div className="ats-badge">
                      <span>ATS Score</span>
                      <strong>{app.atsScore || 0}</strong>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="info-row">
                      <strong>Submitted CGPA:</strong> {app.submittedCgpa || "N/A"}
                    </div>
                    <div className="skills-row">
                      {app.submittedSkills?.map((s, i) => (
                        <span key={i} className="skill-tag">{s}</span>
                      ))}
                    </div>
                    
                    {(app.status === "shortlisted" || app.status === "interview" || app.status === "hired") && (
                      <div className="recruitment-details-box">
                        <label>Test Link / Interview Details</label>
                        <div className="details-input-group">
                          <textarea 
                            value={recruitmentNotes[app._id]} 
                            onChange={(e) => handleNoteChange(app._id, e.target.value)}
                            placeholder="Share test link, venue or instructions..."
                          />
                          <button onClick={() => saveRecruitmentDetails(app._id)} title="Save Details">
                            <Save size={18} />
                          </button>
                        </div>
                        <p className="hint">Visible only to this candidate.</p>
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    <div className="primary-actions">
                      <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer" className="resume-link">View Resume</a>
                      <button className="message-candidate-btn" onClick={() => handleMessageCandidate(app.studentId._id)}>
                        <MessageSquare size={16} /> Message
                      </button>
                    </div>
                    <select 
                      value={app.status} 
                      onChange={(e) => updateStatus(app._id, e.target.value)}
                      className={`status-select ${app.status}`}
                      disabled={app.status === "hired"}
                    >
                      <option value="pending">Pending</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="rejected">Rejected</option>
                      <option value="interview">Interview</option>
                      <option value="hired">Hired</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPushModal && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content governance-modal">
            <div className="modal-header">
              <div className="header-icon-bg" style={{ background: '#ecfdf5' }}><Share2 size={24} color="#10b981" /></div>
              <div>
                <h2>Share List with PO</h2>
                <p>Proactively share a candidate list for <strong>{job?.jobRole}</strong> with the Placement Office.</p>
              </div>
              <button className="close-btn" onClick={() => setShowPushModal(false)}><X size={20}/></button>
            </div>

            <div className="modal-body">
              <div className="stage-selector">
                <label>Select Stage to Share:</label>
                <div className="stage-grid">
                  {["Applied", "Shortlisted", "Interview", "Hired"].map(stage => (
                    <button 
                      key={stage}
                      className={`stage-btn ${pushStage === stage ? 'active' : ''}`}
                      onClick={() => setPushStage(stage)}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
                <p className="governance-hint" style={{ marginTop: '16px' }}>
                  <CheckCircle2 size={14} /> 
                  This will immediately share the current list of candidates in the selected stage with the PO's Command Center.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowPushModal(false)}>Cancel</button>
              <button 
                className="confirm-btn action-btn emerald" 
                onClick={handlePushDataToPO}
                disabled={pushing}
              >
                {pushing ? "Sharing..." : "Share Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplicants;
