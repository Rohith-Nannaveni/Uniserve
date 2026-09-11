import React, { useState, useEffect } from "react";
import newRequest from "../utils/newRequest";
import "./AdminVerificationHub.css";

const AdminVerificationHub = () => {
  const [pending, setPending] = useState({ pendingHR: [], pendingPO: [], pendingStudents: [] });
  const [pendingProfileUpdates, setPendingProfileUpdates] = useState([]);
  const [rejectionReasons, setRejectionReasons] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await newRequest.get("/admin-new/pending-verifications");
      setPending({
        pendingHR: res.data.pendingHR || [],
        pendingPO: res.data.pendingPO || [],
        pendingStudents: res.data.pendingStudents || []
      });

      // Fetch Profile Update Requests
      const updatesRes = await newRequest.get("/users/profile-update-requests");
      setPendingProfileUpdates(updatesRes.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleUpdateAction = async (userId, requestId, action) => {
    const reason = rejectionReasons[requestId] || "";
    if (action === "reject" && !reason) {
      alert("Please provide a rejection reason.");
      return;
    }

    try {
      await newRequest.post("/users/handle-profile-update", {
        userId,
        requestId,
        action,
        rejectionReason: reason
      });
      fetchPending();
      alert(`Update request ${action}ed successfully.`);
    } catch (err) {
      console.log(err);
      alert("Action failed.");
    }
  };

  const handleResolve = async (userId, type, status) => {
    const reason = rejectionReasons[userId] || "";
    if (status === "rejected" && !reason) {
      alert("Please provide a rejection reason.");
      return;
    }

    try {
      await newRequest.patch("/admin-new/resolve-verification", {
        userId,
        type,
        status,
        rejectionReason: status === "rejected" ? reason : "",
      });
      
      const updatedReasons = { ...rejectionReasons };
      delete updatedReasons[userId];
      setRejectionReasons(updatedReasons);
      
      fetchPending();
      alert(`User ${status} successfully.`);
    } catch (err) {
      console.log(err);
      alert("Action failed. " + (err.response?.data?.message || err.message));
    }
  };

  const updateReason = (userId, reason) => {
    setRejectionReasons(prev => ({ ...prev, [userId]: reason }));
  };

  if (loading) return <div className="loading-state">Loading verifications...</div>;

  return (
    <div className="admin-verification-hub">
      <section className="verification-section">
        <h3>Pending HR Verifications</h3>
        {pending.pendingHR.length === 0 ? <p className="empty-msg">No pending HRs</p> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Company Details</th>
                  <th>HR User</th>
                  <th>Action Needed</th>
                </tr>
              </thead>
              <tbody>
                {pending.pendingHR.map(hr => (
                  <tr key={hr._id}>
                    <td>
                      <strong>{hr.hrVerification?.companyName}</strong>
                      <div className="proof-links">
                        <a href={hr.hrVerification?.proof} target="_blank" rel="noreferrer">📄 View Corporate ID</a>
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <span>{hr.username}</span>
                        <small>{hr.email}</small>
                      </div>
                    </td>
                    <td>
                      <div className="resolve-actions">
                        <input 
                          placeholder="Reason if rejecting..." 
                          value={rejectionReasons[hr._id] || ""}
                          onChange={(e) => updateReason(hr._id, e.target.value)} 
                          className="reason-input"
                        />
                        <div className="btn-group">
                          <button className="approve" onClick={() => handleResolve(hr._id, "hr", "approved")}>Approve</button>
                          <button className="reject" onClick={() => handleResolve(hr._id, "hr", "rejected")}>Reject</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="verification-section">
        <h3>Pending PO Verifications</h3>
        {pending.pendingPO.length === 0 ? <p className="empty-msg">No pending POs</p> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Official Details</th>
                  <th>Action Needed</th>
                </tr>
              </thead>
              <tbody>
                {pending.pendingPO.map(po => (
                  <tr key={po._id}>
                    <td>
                      <strong>{po.university}</strong>
                      <div className="proof-links">
                        <a href={po.poVerification?.proof} target="_blank" rel="noreferrer">📄 Official ID</a>
                        <a href={po.poVerification?.authorityLetter} target="_blank" rel="noreferrer">📄 Authority Letter</a>
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <span>{po.username}</span>
                        <small>{po.email}</small>
                      </div>
                    </td>
                    <td>
                      <div className="resolve-actions">
                        <input 
                          placeholder="Reason if rejecting..." 
                          value={rejectionReasons[po._id] || ""}
                          onChange={(e) => updateReason(po._id, e.target.value)} 
                          className="reason-input"
                        />
                        <div className="btn-group">
                          <button className="approve" onClick={() => handleResolve(po._id, "po", "approved")}>Approve</button>
                          <button className="reject" onClick={() => handleResolve(po._id, "po", "rejected")}>Reject</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="verification-section">
        <h3>Pending Student Verifications</h3>
        {pending.pendingStudents.length === 0 ? <p className="empty-msg">No pending student verifications</p> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student & University</th>
                  <th>Academic Documents</th>
                  <th>Action Needed</th>
                </tr>
              </thead>
              <tbody>
                {pending.pendingStudents.map(student => (
                  <tr key={student._id}>
                    <td>
                      <div className="user-info">
                        <strong>{student.username}</strong>
                        <span>Tier: {student.subscription.toUpperCase()}</span>
                        <small>{student.university}</small>
                      </div>
                    </td>
                    <td>
                      <div className="proof-links">
                        <a href={student.studentVerification?.collegeId} target="_blank" rel="noreferrer">📄 College ID Card</a>
                        {student.subscription === "business" && student.studentVerification?.transcripts?.map((t, i) => (
                          <a key={i} href={t} target="_blank" rel="noreferrer">📄 Transcript {i+1}</a>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="resolve-actions">
                        <input 
                          placeholder="Reason if rejecting..." 
                          value={rejectionReasons[student._id] || ""}
                          onChange={(e) => updateReason(student._id, e.target.value)} 
                          className="reason-input"
                        />
                        <div className="btn-group">
                          <button className="approve" onClick={() => handleResolve(student._id, "student", "approved")}>Approve</button>
                          <button className="reject" onClick={() => handleResolve(student._id, "student", "rejected")}>Reject</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      
      <section className="verification-section">
        <h3>Pending Profile Detail Updates</h3>
        {pendingProfileUpdates.length === 0 ? <p className="empty-msg">No pending profile updates</p> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Requested Changes</th>
                  <th>Proofs</th>
                  <th>Action Needed</th>
                </tr>
              </thead>
              <tbody>
                {pendingProfileUpdates.map(req => (
                  <tr key={req.requestId}>
                    <td>
                      <div className="user-info">
                        <strong>{req.username}</strong>
                        <small>{req.email}</small>
                      </div>
                    </td>
                    <td>
                      <div className="changes-list">
                        {Object.entries(req.requestedChanges).map(([key, val]) => (
                          <div key={key} className="change-item">
                            <span className="field">{key}:</span>
                            {key.toLowerCase().includes("resumeurl") ? (
                              <a 
                                href={val} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="value" 
                                style={{ 
                                  color: "#3b82f6", 
                                  textDecoration: "underline",
                                  fontSize: "13px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  marginTop: "5px"
                                }}
                              >
                                📄 Open Resume Document
                              </a>
                            ) : (
                              <span className="value">{Array.isArray(val) ? val.join(", ") : val}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="proof-links">
                        {req.proofs?.map((p, i) => (
                          <a key={i} href={typeof p === 'object' ? p.url : p} target="_blank" rel="noreferrer">
                            📄 {typeof p === 'object' && p.label ? p.label : `Proof ${i + 1}`}
                          </a>
                        ))}
                        {(!req.proofs || req.proofs.length === 0) && <span className="no-proof">No Proof Uploaded</span>}
                      </div>
                    </td>
                    <td>
                      <div className="resolve-actions">
                        <input 
                          placeholder="Reason if rejecting..." 
                          value={rejectionReasons[req.requestId] || ""}
                          onChange={(e) => setRejectionReasons(prev => ({ ...prev, [req.requestId]: e.target.value }))} 
                          className="reason-input"
                        />
                        <div className="btn-group">
                          <button className="approve" onClick={() => handleUpdateAction(req.userId, req.requestId, "approve")}>Approve</button>
                          <button className="reject" onClick={() => handleUpdateAction(req.userId, req.requestId, "reject")}>Reject</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminVerificationHub;
