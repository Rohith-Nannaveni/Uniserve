import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./POOutreach.css";
import newRequest from "../utils/newRequest";
import { Send, Building2, Users, Search, Filter, CheckCircle, Clock, XCircle, Briefcase, GraduationCap, X, MessageSquare, AlertTriangle } from "lucide-react";
import ReportModal from "../components/ReportModal";

function POOutreach() {
  const [hrs, setHrs] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("discover"); // discover, sent, received
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedHr, setSelectedHr] = useState(null);
  const [editingProposalId, setEditingProposalId] = useState(null);
  const [search, setSearch] = useState("");
  
  // Reporting state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingData, setReportingData] = useState({ user: null, proposalId: null });

  const [proposalForm, setProposalForm] = useState({
    type: "campus_drive",
    proposedDates: "",
    targetBranches: "",
    expectedBatch: "",
    description: ""
  });
  
  const [showDeclineForm, setShowDeclineForm] = useState(null); // ID of proposal
  const [declineReason, setDeclineReason] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const navigate = useNavigate();

  useEffect(() => {
    fetchHrs();
  }, [search]);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchHrs = async () => {
    try {
      const res = await newRequest.get(`/hr/directory?search=${search}`);
      setHrs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await newRequest.get("/proposals");
      setProposals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...proposalForm,
        hrId: editingProposalId ? proposals.find(p => p._id === editingProposalId).hrId._id : selectedHr._id,
        poId: currentUser._id,
        initiatedBy: "po",
        proposedDates: [new Date(proposalForm.proposedDates)],
        targetBranches: typeof proposalForm.targetBranches === 'string' ? proposalForm.targetBranches.split(",").map(s => s.trim()) : proposalForm.targetBranches,
        expectedBatch: typeof proposalForm.expectedBatch === 'string' ? proposalForm.expectedBatch.split(",").map(s => s.trim()) : proposalForm.expectedBatch
      };

      if (editingProposalId) {
        await newRequest.put(`/proposals/${editingProposalId}`, payload);
        alert("Proposal updated successfully!");
      } else {
        await newRequest.post("/proposals", payload);
        alert("Proposal sent successfully!");
      }

      setShowProposalModal(false);
      setEditingProposalId(null);
      setProposalForm({
        type: "campus_drive",
        proposedDates: "",
        targetBranches: "",
        expectedBatch: "",
        description: ""
      });
      fetchProposals();
    } catch (err) {
      alert(err.response?.data || "Action failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove/revoke this proposal?")) return;
    try {
      await newRequest.delete(`/proposals/${id}`);
      alert("Proposal removed.");
      fetchProposals();
    } catch (err) {
      alert("Failed to remove proposal.");
    }
  };

  const handleStatusChange = async (id, status) => {
    if (status === "declined" && !declineReason) return alert("Please provide a reason.");
    
    try {
      await newRequest.patch(`/proposals/${id}/status`, { 
        status, 
        declineReason: status === "declined" ? declineReason : "" 
      });
      alert(`Proposal ${status === "declined" ? "declined" : "accepted"} successfully!`);
      setShowDeclineForm(null);
      setDeclineReason("");
      fetchProposals();
    } catch (err) {
      alert("Failed to update proposal status.");
    }
  };

  const handleEditInit = (p) => {
    setEditingProposalId(p._id);
    setProposalForm({
      type: p.type,
      proposedDates: new Date(p.proposedDates[0]).toISOString().split('T')[0],
      targetBranches: p.targetBranches.join(", "),
      expectedBatch: p.expectedBatch.join(", "),
      description: p.description
    });
    setShowProposalModal(true);
  };

  const handleMessageUser = async (userId) => {
    try {
      const res = await newRequest.post("/conversations", { to: userId });
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to start chat.");
    }
  };

  const sentProposals = proposals.filter(p => p.initiatedBy === "po" && p.poId?._id === currentUser._id);
  const receivedProposals = proposals.filter(p => p.initiatedBy === "hr" && p.poId?._id === currentUser._id);
  const pendingReceivedCount = receivedProposals.filter(p => p.status === "pending").length;

  return (
    <div className="po-outreach">
      <div className="container">
        <header className="po-header">
          <h1><Building2 size={32} color="#3b82f6" /> Outreach <span>Center</span></h1>
          <p>Collaborate with verified companies to organize placement drives and internships.</p>
        </header>

        <div className="po-tabs">
          <button className={activeTab === "discover" ? "active" : ""} onClick={() => setActiveTab("discover")}>
            Discover Companies
          </button>
          <button className={activeTab === "sent" ? "active" : ""} onClick={() => setActiveTab("sent")}>
            Sent Proposals ({sentProposals.length})
          </button>
          <button className={activeTab === "received" ? "active" : ""} onClick={() => setActiveTab("received")}>
            Received Proposals {pendingReceivedCount > 0 && <span className="badge-count" style={{background: "#ef4444", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", marginLeft: "5px"}}>{pendingReceivedCount}</span>}
          </button>
        </div>

        {activeTab === "discover" && (
          <>
            <div className="search-filter-section" style={{ marginBottom: "20px" }}>
              <div className="search-input" style={{ display: "flex", alignItems: "center", background: "#f8fafc", padding: "10px 15px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <Search size={20} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="Search companies by name..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  style={{ border: "none", background: "none", padding: "0 10px", outline: "none", width: "100%", fontSize: "0.95rem" }}
                />
              </div>
            </div>
            <div className="hr-list">
            {hrs.length === 0 ? (
                <div className="empty-state" style={{gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#64748b"}}>
                    No verified companies found.
                </div>
            ) : hrs.map(hr => (
              <div key={hr._id} className="hr-card card">
                <div className="hr-info">
                  <div className="hr-avatar">
                    <Building2 size={30} color="#64748b" />
                  </div>
                  <div className="hr-text">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h3>{hr.hrVerification?.companyName || "Verified Company"}</h3>
                      {hr.reliabilityStatus === "low" && (
                        <span className="reliability-badge low" style={{ fontSize: "0.65rem", padding: "2px 8px", background: "#fef3c7", color: "#92400e", borderRadius: "10px", fontWeight: "600", border: "1px solid #fcd34d" }}>
                          LOW TRUST
                        </span>
                      )}
                    </div>
                    <p>{hr.username} • {hr.hrVerification?.workEmail}</p>
                  </div>
                </div>
                <div className="hr-actions" style={{display: "flex", gap: "10px"}}>
                    <button 
                        className="propose-btn" 
                        onClick={() => { setSelectedHr(hr); setShowProposalModal(true); }}
                        disabled={currentUser.reliabilityStatus === "suspended"}
                    >
                        <Send size={16} /> Propose
                    </button>
                    <button className="btn-chat-icon" onClick={() => handleMessageUser(hr._id)} style={{padding: "10px", borderRadius: "12px", border: "none", background: "#f1f5f9", color: "#475569", cursor: "pointer"}}>
                        <MessageSquare size={18} />
                    </button>
                </div>
              </div>
            ))}
          </div>
          </>
        )}

        {activeTab === "sent" && (
          <div className="proposals-list">
            {sentProposals.length === 0 ? (
                <div className="empty-state" style={{gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#64748b"}}>
                    No proposals sent yet.
                </div>
            ) : sentProposals.map(p => (
              <div key={p._id} className="proposal-card card" style={{ position: "relative" }}>
                <button 
                  className="close-p-btn" 
                  onClick={() => handleDelete(p._id)}
                  title="Remove proposal from history"
                  style={{position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer"}}
                >
                  <X size={16} />
                </button>
                <div className="p-header">
                  <div className="p-type">{p.type.replace("_", " ").toUpperCase()}</div>
                  <div className={`p-status ${p.status}`}>
                    {p.status === "pending" && <Clock size={14} />}
                    {p.status === "accepted" && <CheckCircle size={14} />}
                    {p.status === "declined" && <XCircle size={14} />}
                    {p.status.toUpperCase()}
                  </div>
                </div>
                <div className="p-body">
                  <h3>To: {p.hrId?.hrVerification?.companyName || "Recruiter"}</h3>
                  <p><strong>Target:</strong> {p.targetBranches?.join(", ")} ({p.expectedBatch?.join(", ")})</p>
                  <p><strong>Proposed:</strong> {new Date(p.proposedDates[0]).toLocaleDateString()}</p>
                </div>
                {p.status === "declined" && p.declineReason && (
                  <div className="p-decline" style={{
                    marginTop: "15px",
                    padding: "12px",
                    background: "#fff1f2",
                    borderRadius: "8px",
                    border: "1px solid #fecdd3",
                    fontSize: "0.9rem",
                    color: "#b91c1c"
                  }}>
                    <strong>Decline Reason:</strong> {p.declineReason}
                  </div>
                )}
                <div className="p-actions" style={{display: "flex", gap: "10px", marginTop: "20px"}}>
                  {p.status === "pending" && (
                    <button 
                      className="edit-btn" 
                      onClick={() => handleEditInit(p)} 
                      style={{flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer"}}
                      disabled={currentUser.reliabilityStatus === "suspended"}
                    >Edit</button>
                  )}
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(p._id)} 
                    style={{flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#ef4444", cursor: "pointer"}}
                    disabled={currentUser.reliabilityStatus === "suspended" && p.status === "pending"}
                  >
                    {p.status === "accepted" ? "Disconnect" : p.status === "pending" ? "Revoke" : "Remove from History"}
                  </button>
                </div>
                {p.status === "accepted" && (
                  <button 
                    className="report-btn-link"
                    onClick={() => {
                      setReportingData({ user: p.hrId, proposalId: p._id });
                      setShowReportModal(true);
                    }}
                    style={{width: "100%", marginTop: "10px", background: "none", border: "none", color: "#ef4444", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"}}
                  >
                    <AlertTriangle size={14} /> Report Issue with HR
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "received" && (
          <div className="proposals-list">
            {receivedProposals.length === 0 ? (
                <div className="empty-state" style={{gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#64748b"}}>
                    No proposals received yet.
                </div>
            ) : receivedProposals.map(p => (
              <div key={p._id} className="proposal-card card" style={{ position: "relative" }}>
                <button 
                  className="close-p-btn" 
                  onClick={() => handleDelete(p._id)}
                  title="Remove proposal from history"
                  style={{position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer"}}
                >
                  <X size={16} />
                </button>
                <div className="p-header">
                  <div className="p-type">{p.type.replace("_", " ").toUpperCase()}</div>
                  <div className={`p-status ${p.status}`}>
                    {p.status === "pending" && <Clock size={14} />}
                    {p.status === "accepted" && <CheckCircle size={14} />}
                    {p.status === "declined" && <XCircle size={14} />}
                    {p.status.toUpperCase()}
                  </div>
                </div>
                <div className="p-body">
                  <h3>From: {p.hrId?.hrVerification?.companyName || "Verified Company"}</h3>
                  <p><strong>HR:</strong> {p.hrId?.username}</p>
                  <p><strong>Target:</strong> {p.targetBranches?.join(", ")} ({p.expectedBatch?.join(", ")})</p>
                  <p><strong>Proposed:</strong> {new Date(p.proposedDates[0]).toLocaleDateString()}</p>
                  {p.description && (
                    <div className="p-desc" style={{marginTop: "10px", fontSize: "0.85rem", color: "#64748b", background: "#f8fafc", padding: "10px", borderRadius: "8px"}}>
                      {p.description}
                    </div>
                  )}
                </div>
                
                {p.status === "declined" && p.declineReason && (
                  <div className="p-decline" style={{
                    marginTop: "15px",
                    padding: "12px",
                    background: "#fff1f2",
                    borderRadius: "8px",
                    border: "1px solid #fecdd3",
                    fontSize: "0.9rem",
                    color: "#b91c1c"
                  }}>
                    <strong>Your Decline Reason:</strong> {p.declineReason}
                  </div>
                )}

                <div className="p-actions" style={{display: "flex", gap: "10px", marginTop: "20px"}}>
                  {p.status === "pending" ? (
                    <>
                      <button className="accept-btn" onClick={() => handleStatusChange(p._id, "accepted")} style={{flex: 1}}>Accept</button>
                      <button className="decline-btn" onClick={() => setShowDeclineForm(p._id)} style={{flex: 1}}>Decline</button>
                    </>
                  ) : (
                    <>
                      {p.status === "accepted" && (
                        <button className="chat-btn" onClick={() => handleMessageUser(p.hrId?._id)} style={{flex: 2}}>
                          <MessageSquare size={16} /> Open Chat
                        </button>
                      )}
                      <button className="delete-btn" onClick={() => handleDelete(p._id)} style={{flex: 1}}>
                        {p.status === "accepted" ? "Disconnect" : "Remove"}
                      </button>
                    </>
                  )}
                </div>

                {p.status === "accepted" && (
                  <button 
                    className="report-btn-link"
                    onClick={() => {
                      setReportingData({ user: p.hrId, proposalId: p._id });
                      setShowReportModal(true);
                    }}
                    style={{width: "100%", marginTop: "10px", background: "none", border: "none", color: "#ef4444", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"}}
                  >
                    <AlertTriangle size={14} /> Report Issue with HR
                  </button>
                )}

                {showDeclineForm === p._id && (
                  <div className="decline-form" style={{marginTop: "15px", padding: "15px", background: "#fff1f2", borderRadius: "10px", border: "1px solid #fecdd3"}}>
                    <textarea 
                      placeholder="Why are you declining this proposal?" 
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      style={{width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #fda4af", marginBottom: "10px"}}
                    />
                    <div className="form-btns" style={{display: "flex", gap: "10px"}}>
                      <button className="confirm-decline" onClick={() => handleStatusChange(p._id, "declined")} style={{flex: 2, background: "#e11d48", color: "white", border: "none", padding: "8px", borderRadius: "6px", fontWeight: "600", cursor: "pointer"}}>Confirm Decline</button>
                      <button className="cancel-decline" onClick={() => {setShowDeclineForm(null); setDeclineReason("");}} style={{flex: 1, background: "white", border: "1px solid #e2e8f0", padding: "8px", borderRadius: "6px", cursor: "pointer"}}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showProposalModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{maxWidth: "600px", width: "100%", background: "#1a2a47", padding: "40px", borderRadius: "20px"}}>
            <h2 style={{color: "white"}}>{editingProposalId ? "Edit Proposal" : "Collaboration Proposal"}</h2>
            <p style={{color: "#e2e8f0", marginBottom: "30px"}}>
              {editingProposalId ? "Update your formal request to " : "Send a formal request to "}
              <strong>{editingProposalId ? proposals.find(p => p._id === editingProposalId)?.hrId?.hrVerification?.companyName : selectedHr?.hrVerification?.companyName}</strong>
            </p>
            
            <form onSubmit={handleProposalSubmit}>
              <div className="form-group" style={{marginBottom: "20px"}}>
                  <label style={{color: "#94a3b8", display: "block", marginBottom: "8px", fontWeight: "600"}}>Collaboration Type</label>
                  <select value={proposalForm.type} onChange={e => setProposalForm({...proposalForm, type: e.target.value})} style={{width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "white"}}>
                    <option value="campus_drive">Campus Placement Drive</option>
                    <option value="internship">Internship Program</option>
                    <option value="workshop">Skill Workshop</option>
                    <option value="bulk_hiring">Bulk Hiring</option>
                  </select>
              </div>

              <div className="form-group" style={{marginBottom: "20px"}}>
                  <label style={{color: "#94a3b8", display: "block", marginBottom: "8px", fontWeight: "600"}}>Proposed Date</label>
                  <input type="date" value={proposalForm.proposedDates} required onChange={e => setProposalForm({...proposalForm, proposedDates: e.target.value})} style={{width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "white"}} />
              </div>

              <div className="form-group" style={{marginBottom: "20px"}}>
                  <label style={{color: "#94a3b8", display: "block", marginBottom: "8px", fontWeight: "600"}}>Target Branches (Comma separated)</label>
                  <input value={proposalForm.targetBranches} placeholder="CSE, ECE, IT" required onChange={e => setProposalForm({...proposalForm, targetBranches: e.target.value})} style={{width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "white"}} />
              </div>

              <div className="form-group" style={{marginBottom: "20px"}}>
                  <label style={{color: "#94a3b8", display: "block", marginBottom: "8px", fontWeight: "600"}}>Expected Batch Years (Comma separated)</label>
                  <input value={proposalForm.expectedBatch} placeholder="2026" required onChange={e => setProposalForm({...proposalForm, expectedBatch: e.target.value})} style={{width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "white"}} />
              </div>

              <div className="form-group" style={{marginBottom: "20px"}}>
                  <label style={{color: "#94a3b8", display: "block", marginBottom: "8px", fontWeight: "600"}}>Additional Details</label>
                  <textarea value={proposalForm.description} rows="4" placeholder="Briefly explain your requirements..." onChange={e => setProposalForm({...proposalForm, description: e.target.value})} style={{width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #334155", background: "#0f172a", color: "white"}} />
              </div>

              <div className="modal-actions" style={{display: "flex", gap: "15px", marginTop: "30px"}}>
                <button type="button" className="cancel-btn" onClick={() => { setShowProposalModal(false); setEditingProposalId(null); }} style={{flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "#334155", color: "white", fontWeight: "700", cursor: "pointer"}}>Cancel</button>
                <button type="submit" className="submit-btn" style={{flex: 2, padding: "14px", borderRadius: "12px", border: "none", background: "#3b82f6", color: "white", fontWeight: "700", cursor: "pointer"}}>{editingProposalId ? "Update Proposal" : "Send Proposal"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showReportModal && reportingData.user && (
        <ReportModal 
          isOpen={showReportModal} 
          onClose={() => setShowReportModal(false)}
          reportedUser={reportingData.user}
          proposalId={reportingData.proposalId}
        />
      )}
    </div>
  );
}

export default POOutreach;
