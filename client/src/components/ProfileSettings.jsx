import React, { useState } from "react";
import "./ProfileSettings.css";
import newRequest from "../utils/newRequest";
import { 
  Building2, 
  FileText, 
  ShieldCheck, 
  Upload, 
  Save, 
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import upload from "../utils/upload";

const ProfileSettings = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [requestedChanges, setRequestedChanges] = useState({
    university: user.university || "",
    "poVerification.department": user.poVerification?.department || ""
  });
  const [proofs, setProofs] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setRequestedChanges(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = async (e, label) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const url = await upload(file);
      setProofs(prev => [...prev, { url, label }]);
      setSuccess(`${label} uploaded successfully!`);
    } catch (err) {
      setError(`Failed to upload ${label}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (proofs.length === 0 && requestedChanges.university !== user.university) {
        setError("Please upload an official proof for university name change.");
        setLoading(false);
        return;
    }

    try {
      await newRequest.post("/users/profile-update-request", {
        requestedChanges,
        proofs
      });
      setSuccess("Institutional update request submitted to Admin for verification.");
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  const pendingRequest = user.profileUpdateRequests?.find(r => r.status === "pending");

  return (
    <div className="profile-settings-tab card">
      <div className="tab-header">
        <Building2 size={24} color="#3b82f6" />
        <div>
          <h3>Institutional Profile & Verification</h3>
          <p>Manage your university details and official credentials.</p>
        </div>
      </div>

      {pendingRequest && (
        <div className="pending-notice alert">
          <Clock size={20} />
          <div>
            <strong>Update Request Pending</strong>
            <p>You have a pending request to update: {Object.keys(pendingRequest.requestedChanges).join(", ")}. Please wait for Admin approval.</p>
          </div>
        </div>
      )}

      {success && <div className="success-msg alert"><CheckCircle2 size={18} /> {success}</div>}
      {error && <div className="error-msg alert"><AlertCircle size={18} /> {error}</div>}

      <form className="settings-form" onSubmit={handleSubmitRequest}>
        <div className="form-section">
          <h4>Institutional Details</h4>
          <div className="input-group">
            <label>University / Organization Name</label>
            <input 
              name="university"
              value={requestedChanges.university}
              onChange={handleChange}
              placeholder="Full official name"
              disabled={!!pendingRequest}
            />
            <small className="help-text">Changing this will trigger Admin re-verification of your PO status.</small>
          </div>

          <div className="input-group">
            <label>Department</label>
            <input 
              name="poVerification.department"
              value={requestedChanges["poVerification.department"]}
              onChange={handleChange}
              placeholder="e.g. Training & Placement Cell"
              disabled={!!pendingRequest}
            />
          </div>
        </div>

        <div className="form-section">
          <h4>Verification Proofs</h4>
          <p className="section-desc">Upload official documents if you are requesting a name change or updating credentials.</p>
          
          <div className="proofs-grid">
            <div className="proof-card">
              <FileText size={20} />
              <div className="p-info">
                <strong>Official ID / Appointment Letter</strong>
                <span>{user.poVerification?.proof ? "✅ Current ID Uploaded" : "❌ No ID on file"}</span>
              </div>
              <label className="upload-label">
                <Upload size={16} /> Update
                <input type="file" onChange={(e) => handleFileChange(e, "Official ID")} hidden disabled={!!pendingRequest || uploading}/>
              </label>
            </div>

            <div className="proof-card">
              <ShieldCheck size={20} />
              <div className="p-info">
                <strong>University Authority Letter</strong>
                <span>{user.poVerification?.authorityLetter ? "✅ Current Letter Uploaded" : "❌ No letter on file"}</span>
              </div>
              <label className="upload-label">
                <Upload size={16} /> Update
                <input type="file" onChange={(e) => handleFileChange(e, "Authority Letter")} hidden disabled={!!pendingRequest || uploading}/>
              </label>
            </div>
          </div>

          {proofs.length > 0 && (
            <div className="new-uploads">
              <strong>Newly Uploaded (Pending Submission):</strong>
              <ul>
                {proofs.map((p, i) => <li key={i}>{p.label}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={loading || uploading || !!pendingRequest}>
            {loading ? "Submitting..." : uploading ? "Uploading..." : <><Save size={18} /> Submit for Verification</>}
          </button>
        </div>
      </form>

      <div className="institutional-status">
        <ShieldCheck size={16} />
        <span>Verification Status: <strong>{user.poVerification?.status.toUpperCase()}</strong></span>
      </div>
    </div>
  );
};

export default ProfileSettings;
