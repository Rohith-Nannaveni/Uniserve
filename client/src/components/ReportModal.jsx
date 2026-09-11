import React, { useState } from "react";
import { X, Upload, AlertTriangle, FileText } from "lucide-react";
import newRequest from "../utils/newRequest";
import upload from "../utils/upload";
import "./ReportModal.css";

const ReportModal = ({ isOpen, onClose, reportedUser, proposalId }) => {
  const [category, setCategory] = useState("Ghosting after Acceptance");
  const [reason, setReason] = useState("");
  const [proofs, setProofs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await upload(file);
      setProofs((prev) => [...prev, url]);
    } catch (err) {
      alert("Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return alert("Please provide a reason for the report.");
    if (proofs.length === 0) return alert("Please upload at least one proof (screenshot/document).");

    setSubmitting(true);
    try {
      await newRequest.post("/reports", {
        reportedId: reportedUser._id,
        proposalId,
        category,
        reason,
        proofs,
      });
      alert("Report submitted successfully. Admin will review the case.");
      onClose();
    } catch (err) {
      alert(err.response?.data || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content report-modal card">
        <div className="modal-header">
          <div className="title-group">
            <AlertTriangle color="#ef4444" size={24} />
            <h2>Report Professional Misconduct</h2>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          <div className="target-info alert">
            <p>Reporting: <strong>{reportedUser.username}</strong> ({reportedUser.role?.toUpperCase()})</p>
            <small>Filing a fake report may lead to your own account being restricted.</small>
          </div>

          <div className="form-group">
            <label>Category of Issue</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Ghosting after Acceptance">Ghosting after Acceptance</option>
              <option value="False Job Details">False Job Details</option>
              <option value="Unprofessional Conduct">Unprofessional Conduct</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Detailed Explanation</label>
            <textarea 
              placeholder="Please explain what happened in detail..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>Supporting Proofs (Screenshots/Documents)</label>
            <div className="upload-controls">
              <input type="file" id="report-proof" hidden onChange={handleFileUpload} disabled={uploading} />
              <label htmlFor="report-proof" className="upload-label">
                {uploading ? "Uploading..." : <><Upload size={18} /> Add Document</>}
              </label>
            </div>
            {proofs.length > 0 && (
              <div className="proof-list">
                {proofs.map((p, i) => (
                  <div key={i} className="proof-item">
                    <FileText size={14} />
                    <span>Document {i+1}</span>
                    <button type="button" onClick={() => setProofs(prev => prev.filter((_, idx) => idx !== i))}>&times;</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Official Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
