import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, ArrowLeft, Mail, Info } from "lucide-react";
import "./POUnregistered.css";

const POUnregistered = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const university = searchParams.get("university") || "this university";

  return (
    <div className="po-unregistered">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>

        <div className="unregistered-card card">
          <div className="icon-wrapper">
            <Building2 size={64} color="#94a3b8" />
            <div className="info-badge">
              <Info size={24} color="#f59e0b" />
            </div>
          </div>
          
          <h1>Placement Office Not Registered</h1>
          <p className="subtitle">
            The university <strong>{university}</strong> has not yet registered its Placement Officer on the UniServe platform.
          </p>

          <div className="explanation-section">
            <div className="info-item">
              <h3>What does this mean?</h3>
              <p>
                To maintain the highest standards of trust and verification, candidate credentials (transcripts, college IDs, etc.) 
                are directly verified by their university's Placement Officer. Since this university isn't registered, 
                official verification and campus outreach through the PO are currently unavailable.
              </p>
            </div>

            <div className="info-item">
              <h3>Can I still contact the candidate?</h3>
              <p>
                Yes! You can still message the candidate directly or view their uploaded resume. However, 
                "University Endorsed" status and direct PO collaboration for campus drives are not yet possible for this institution.
              </p>
            </div>
          </div>

          <div className="action-buttons">
            <button className="secondary-btn" onClick={() => navigate(-1)}>
              Return to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POUnregistered;
