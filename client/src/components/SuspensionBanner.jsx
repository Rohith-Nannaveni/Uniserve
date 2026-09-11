import React, { useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import newRequest from "../utils/newRequest";
import "./SuspensionBanner.css";

const SuspensionBanner = ({ user, onAppealSubmitted }) => {
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [appealDocs, setAppealDocs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const upload = (await import("../utils/upload")).default;
      const url = await upload(file);
      setAppealDocs(prev => [...prev, url]);
    } catch (err) {
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await newRequest.post("/users/suspension-appeal", { 
        appealReason,
        appealDocuments: appealDocs 
      });
      setMessage("Appeal submitted successfully! Admin will review it soon.");
      setTimeout(() => {
        setShowAppealModal(false);
        if (onAppealSubmitted) onAppealSubmitted();
        window.location.reload();
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data || "Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user.reliabilityStatus === "normal") return null;

  const isLowTrust = user.reliabilityStatus === "low";

  return (
    <div className={`suspension-banner ${isLowTrust ? "low-trust-banner" : ""}`}>
      <div className="suspension-content">
        <div className="suspension-info">
          <AlertTriangle className="suspension-icon" />
          <div>
            <h3>{isLowTrust ? "Low Trust Status" : "Account Suspended"}</h3>
            <p>{isLowTrust ? "Your profile carries a Low Trust Badge. You can appeal to have it removed." : "Your institutional professional actions are restricted."}</p>
            {user.suspensionReason && (
              <p className="suspension-reason"><strong>Reason:</strong> {user.suspensionReason}</p>
            )}
          </div>
        </div>
        {user.appealStatus === "pending" ? (
          <div className="appeal-pending">Appeal Under Review</div>
        ) : (
          <button className="appeal-btn" onClick={() => setShowAppealModal(true)}>
            {isLowTrust ? "Appeal Low Trust Badge" : "Appeal Suspension"}
          </button>
        )}
      </div>

      {showAppealModal && (
        <div className="appeal-modal-overlay">
          <div className="appeal-modal">
            <h2>Submit Appeal</h2>
            <p>{isLowTrust ? "Explain why your Low Trust Badge should be removed." : "Explain why your suspension should be lifted."} Proof submission is optional.</p>
            <form onSubmit={handleSubmitAppeal}>
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Type your reason here..."
                required
              />
              <div className="appeal-upload-section">
                <label>Supporting Documents (Optional)</label>
                <div className="upload-row">
                  <input 
                    type="file" 
                    id="appeal-docs" 
                    hidden 
                    onChange={handleFileUpload} 
                    disabled={uploading}
                  />
                  <label htmlFor="appeal-docs" className="upload-trigger">
                    {uploading ? "Uploading..." : "Attach Proof (PDF/Image)"}
                  </label>
                  {appealDocs.length > 0 && <span className="upload-count">{appealDocs.length} file(s) attached</span>}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAppealModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : <><Send size={16} /> Submit Appeal</>}
                </button>
              </div>
              {message && <p className="modal-message">{message}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspensionBanner;
