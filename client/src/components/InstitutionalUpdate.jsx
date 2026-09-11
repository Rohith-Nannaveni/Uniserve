import React, { useState } from "react";
import "./InstitutionalUpdate.css";
import newRequest from "../utils/newRequest";
import upload from "../utils/upload";
import { ShieldCheck, Upload, CheckCircle2, Clock, AlertCircle } from "lucide-react";

const InstitutionalUpdate = ({ user, onUpdate }) => {
  const [requestedUniversity, setRequestedUniversity] = useState(user?.university || "");
  const [uniProofFile, setUniProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleUniversityUpdate = async (e) => {
    e.preventDefault();
    if (!requestedUniversity) return alert("Please enter a university name.");
    if (!uniProofFile) return alert("Please upload a proof (College ID or Transcript).");
    
    setLoading(true);
    setMsg("");
    setError("");
    try {
      const proofUrl = await upload(uniProofFile);
      await newRequest.post("/users/profile-update-request", {
        requestedChanges: { university: requestedUniversity },
        proofs: [{ url: proofUrl, label: "University Change Proof" }]
      });
      setMsg("Request submitted to Admin for verification.");
      if (onUpdate) onUpdate();
    } catch (err) {
      setError("Error submitting request.");
    } finally {
      setLoading(false);
    }
  };

  const pendingRequest = user?.profileUpdateRequests?.find(r => r.status === "pending" && r.requestedChanges.university);

  return (
    <div className="institutional-update card">
      <div className="section-header">
        <ShieldCheck size={32} color="#3b82f6" />
        <div>
          <h2>Institutional Verification</h2>
          <p>Request a change to your linked university or institutional details.</p>
        </div>
      </div>

      {pendingRequest && (
        <div className="pending-notice alert">
          <Clock size={20} />
          <div>
            <strong>Update Request Pending</strong>
            <p>Admin is currently reviewing your request to change university to: {pendingRequest.requestedChanges.university}</p>
          </div>
        </div>
      )}

      {msg && <div className="success-msg alert"><CheckCircle2 size={18} /> {msg}</div>}
      {error && <div className="error-msg alert"><AlertCircle size={18} /> {error}</div>}

      <form onSubmit={handleUniversityUpdate} className="uni-update-form">
        <div className="form-group">
          <label>Official University Name</label>
          <input 
            type="text" 
            value={requestedUniversity} 
            onChange={(e) => setRequestedUniversity(e.target.value)}
            placeholder="Enter full official name"
            disabled={loading || !!pendingRequest}
          />
          <small>Ensure the name matches exactly as per your official documents.</small>
        </div>

        <div className="form-group">
          <label>Official Proof (College ID / Transcript)</label>
          <div className="file-drop-zone">
            <input 
              type="file" 
              id="uni-proof"
              onChange={(e) => setUniProofFile(e.target.files[0])}
              hidden
              disabled={loading || !!pendingRequest}
            />
            <label htmlFor="uni-proof" className="file-label">
              <Upload size={24} />
              {uniProofFile ? uniProofFile.name : "Click to upload document"}
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading || !!pendingRequest}
        >
          {loading ? "Submitting..." : "Request Institutional Update"}
        </button>
      </form>
    </div>
  );
};

export default InstitutionalUpdate;
