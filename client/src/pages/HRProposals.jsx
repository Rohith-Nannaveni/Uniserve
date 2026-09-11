import React, { useState, useEffect } from "react";
import "./POOutreach.css"; // Reuse styling for consistency
import newRequest from "../utils/newRequest";
import { CheckCircle, XCircle, Clock, Building2, Calendar, Users, GraduationCap, MessageSquare, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReportModal from "../components/ReportModal";

function HRProposals() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [declineReason, setDeclineReason] = useState("");
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  
  // Reporting state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingData, setReportingData] = useState({ user: null, proposalId: null });

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.role !== "hr" || currentUser.hrVerification?.status !== "approved") {
      navigate("/dashboard");
      return;
    }
    fetchProposals();
  }, []);

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

  const handleStatusUpdate = async (id, status) => {
    if (status === "declined" && !declineReason) {
      alert("Please provide a reason for declining.");
      return;
    }

    try {
      await newRequest.patch(`/proposals/${id}/status`, {
        status,
        declineReason: status === "declined" ? declineReason : ""
      });
      alert(`Proposal ${status}!`);
      setSelectedProposalId(null);
      setDeclineReason("");
      fetchProposals();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleOpenChat = async (poId) => {
    try {
      const res = await newRequest.post("/conversations", { to: poId });
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to start chat with PO.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to disconnect/remove this proposal?")) return;
    try {
      await newRequest.delete(`/proposals/${id}`);
      alert("Proposal removed.");
      fetchProposals();
    } catch (err) {
      alert("Failed to remove proposal.");
    }
  };

  if (loading) return <div className="po-outreach-loading">Loading proposals...</div>;

  return (
    <div className="po-outreach">
      <div className="container">
        <header className="po-header">
          <h1><Building2 size={32} color="#3b82f6" /> Institutional <span>Proposals</span></h1>
          <p>Review and respond to collaboration requests from University Placement Officers.</p>
        </header>

        <div className="proposals-list">
          {proposals.length === 0 ? (
            <div className="no-results card" style={{textAlign: "center", padding: "60px"}}>
              <Users size={60} color="#cbd5e1" style={{marginBottom: "20px"}} />
              <h3>No proposals yet</h3>
              <p>Proposals from placement officers will appear here.</p>
            </div>
          ) : (
            proposals.map(p => (
              <div key={p._id} className="proposal-card card">
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
                  <h3>From: {p.universityName}</h3>
                  <p className="po-meta">By: {p.poId?.username}</p>
                  
                  <div className="p-details">
                    <div className="p-detail">
                      <Calendar size={16} /> 
                      <span><strong>Proposed:</strong> {new Date(p.proposedDates[0]).toLocaleDateString()}</span>
                    </div>
                    <div className="p-detail">
                      <GraduationCap size={16} /> 
                      <span><strong>Branches:</strong> {p.targetBranches?.join(", ")}</span>
                    </div>
                    <div className="p-detail">
                      <Users size={16} /> 
                      <span><strong>Batch:</strong> {p.expectedBatch?.join(", ")}</span>
                    </div>
                  </div>

                  {p.description && (
                    <div className="p-desc">
                      <strong>Note:</strong> {p.description}
                    </div>
                  )}
                </div>

                {p.status === "pending" && (
                  <div className="p-actions">
                    <button className="accept-btn" onClick={() => handleStatusUpdate(p._id, "accepted")}>
                      Accept & Connect
                    </button>
                    <button className="decline-btn" onClick={() => setSelectedProposalId(p._id)}>
                      Decline
                    </button>
                  </div>
                )}

                {selectedProposalId === p._id && (
                  <div className="decline-form">
                    <textarea 
                      placeholder="Why are you declining this proposal?" 
                      onChange={(e) => setDeclineReason(e.target.value)}
                    />
                    <div className="form-btns">
                      <button className="confirm-decline" onClick={() => handleStatusUpdate(p._id, "declined")}>Confirm Decline</button>
                      <button className="cancel-decline" onClick={() => setSelectedProposalId(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {p.status === "accepted" && (
                  <div className="p-actions-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "20px"}}>
                    <button className="create-job-btn" onClick={() => navigate("/manage-jobs", { 
                      state: { 
                        isOnCampus: true, 
                        exclusivePO: p.poId?._id, 
                        proposalId: p._id,
                        companyName: currentUser.hrVerification?.companyName,
                        universityName: p.universityName
                      } 
                    })} style={{gridColumn: "1/-1", background: "#10b981", color: "white", border: "none", padding: "12px", borderRadius: "8px", fontWeight: "600", cursor: "pointer"}}>
                      Post Exclusive Job for {p.universityName}
                    </button>
                    <button className="chat-btn" onClick={() => handleOpenChat(p.poId._id)} style={{background: "#f1f5f9", color: "#475569", border: "none", padding: "10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"}}>
                      <MessageSquare size={16} /> Chat
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(p._id)} style={{background: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2", padding: "10px", borderRadius: "8px", cursor: "pointer"}}>
                      Disconnect
                    </button>
                    <button 
                      className="report-btn-link"
                      onClick={() => {
                        setReportingData({ user: p.poId, proposalId: p._id });
                        setShowReportModal(true);
                      }}
                      style={{gridColumn: "1/-1", marginTop: "10px", background: "none", border: "none", color: "#ef4444", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px"}}
                    >
                      <AlertTriangle size={14} /> Report Issue with Placement Officer
                    </button>
                  </div>
                )}
                {p.status === "declined" && (
                  <button className="delete-btn" style={{width: "100%", marginTop: "15px"}} onClick={() => handleDelete(p._id)}>
                    Remove from History
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
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

export default HRProposals;
