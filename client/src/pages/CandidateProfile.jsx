import React, { useState, useEffect } from "react";
import "./CandidateProfile.css";
import { useParams, useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";
import { User, GraduationCap, MapPin, Phone, Mail, FileText, ExternalLink, ShieldCheck, Star, Building2, ChevronLeft, Download, Lock, Unlock, AlertTriangle } from "lucide-react";

function CandidateProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const isOwner = currentUser?._id === id;

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const res = await newRequest.get(`/hr/candidate/${id}`);
        setStudent(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load candidate profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [id]);

  const handleContactCandidate = async () => {
    try {
      const res = await newRequest.post("/conversations", { to: id });
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      console.log(err);
      alert("Failed to start conversation.");
    }
  };

  const handleContactPO = async () => {
    if (currentUser?.role === "student") {
      try {
        const res = await newRequest.get(`/hr/po-contact?university=${student.university}`);
        const poId = res.data._id;
        const convRes = await newRequest.post("/conversations", { to: poId });
        navigate(`/message/${convRes.data.id}`);
      } catch (err) {
        console.error(err);
        navigate(`/po-not-registered?university=${student.university}`);
      }
    } else {
      navigate(`/po/contact?university=${student.university}`);
    }
  };

  if (loading) return <div className="candidate-profile-loading">Loading verified candidate profile...</div>;
  if (error) return <div className="candidate-profile-error">{error}</div>;

  return (
    <div className="candidate-profile">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} /> Back to Search
        </button>

        <div className="profile-grid">
          {/* Left Column - Main Info */}
          <div className="main-info">
            <div className="profile-card card">
              <div className="profile-header">
                <div className="avatar-big">
                  {student.img ? <img src={student.img} alt="" /> : <User size={80} color="#94a3b8" />}
                  {student.subscription === "business" && <div className="tier-badge">Verified Talent</div>}
                </div>
                <div className="header-text">
                  <h1>{student.username}</h1>
                  <p className="subtitle">
                    {student.university || "Verified University Talent"}
                    {student.branch && ` • ${student.branch}`}
                    {student.specialization && ` (${student.specialization})`}
                  </p>
                  <div className="badges">
                    {student.trustBadge !== "none" && student.trustBadge && (
                      <span className={`badge ${student.trustBadge.toLowerCase()}`}>
                        <ShieldCheck size={14} /> {student.trustBadge.toLowerCase() === "pro" || student.trustBadge.toLowerCase() === "expert" ? "Verified Talent" : student.trustBadge.toUpperCase()}
                      </span>
                    )}
                    {student.isRecommended && (
                      <span className="badge endorsed">
                        <Star size={14} fill="currentColor" /> UNIVERSITY ENDORSED
                      </span>
                    )}
                    <span className="badge verified">
                      <ShieldCheck size={14} /> VERIFIED IDENTITY
                    </span>
                  </div>
                </div>
                <div className="ats-main">
                  <span className="score">{student.resumeData?.atsScore || 0}</span>
                  <span className="lbl">ATS SCORE</span>
                </div>
              </div>

              <div className="profile-body">
                <div className="bio-section">
                  <h3>About Candidate</h3>
                  <p>{student.desc || "No description provided."}</p>
                </div>

                <div className="skills-section">
                  <h3>Verified Skills</h3>
                  <div className="skills-grid">
                    {student.resumeData?.parsedSkills?.map((skill, i) => (
                      <span key={i} className="skill-chip">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="details-row">
                  <div className="detail-item">
                    <MapPin size={18} color="#64748b" />
                    <span>{student.country}</span>
                  </div>
                  <div className="detail-item">
                    <GraduationCap size={18} color="#64748b" />
                    <span>Class of {student.graduationYear || "Not specified"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="academic-card card">
              <h3>Academic Credentials</h3>
              <div className="credential-item">
                <div className="c-icon"><FileText size={20} /></div>
                <div className="c-info">
                  <strong>Verified Transcripts</strong>
                  <p>Consolidated academic records till current semester.</p>
                </div>
                {student.studentVerification?.transcripts?.length > 0 ? (
                  <div className="transcript-btns">
                    {student.studentVerification.transcripts.map((t, i) => (
                      <button key={i} className="c-btn" onClick={() => window.open(t, '_blank')}>
                        <Download size={16} /> {student.studentVerification.transcripts.length > 1 ? `Transcript ${i+1}` : 'Download PDF'}
                      </button>
                    ))}
                  </div>
                ) : (student.subscription === "business" && (student.studentVerification?.status !== "approved" || !student.studentVerification?.transcripts?.length)) ? (
                  <span className="c-status">Pending Verification</span>
                ) : student.studentVerification?.status === "approved" ? (
                  <span className="c-status approved">Verification Approved</span>
                ) : (
                  <span className="c-status">Pending Verification</span>
                )}
              </div>
            </div>

            {/* Placement Governance & Transparency */}
            {(isOwner || currentUser?.role === "po" || currentUser?.isAdmin) && student.subscription === "business" && (
              <div className="governance-card card">
                <div className="card-header-flex">
                  <h3>Placement Governance & Eligibility</h3>
                  <div className={`eligibility-status ${student.governance?.isLocked ? 'locked' : 'active'}`}>
                    {student.governance?.isLocked ? <Lock size={16}/> : <Unlock size={16}/>}
                    {student.governance?.isLocked ? "PLACEMENT LOCKED" : "ELIGIBLE FOR DRIVES"}
                  </div>
                </div>

                <div className="gov-grid">
                  <div className="gov-item">
                    <div className="gov-label">Current Highest Offer</div>
                    <div className="gov-value">
                      {student.currentHighestOnCampusOffer > 0 ? (
                        <span className="offer-tag">₹{student.currentHighestOnCampusOffer} LPA ({student.onCampusCompany})</span>
                      ) : "Unplaced"}
                    </div>
                  </div>

                  {student.governance?.multiplier > 0 && (
                    <div className="gov-item">
                      <div className="gov-label">Multiplier Policy (PO Set)</div>
                      <div className="gov-value highlight">
                        {student.governance.multiplier}X Policy Active
                        <small>Can apply for jobs ≥ ₹{(student.currentHighestOnCampusOffer * student.governance.multiplier).toFixed(1)} LPA</small>
                      </div>
                    </div>
                  )}

                  {student.globalSettings?.autoApplyMultiplier && (
                    <div className="gov-item">
                      <div className="gov-label">Global Campus Policy</div>
                      <div className="gov-value">
                        {student.globalSettings.globalMultiplierValue}X Auto-Multiplier
                        <small>Applied automatically upon placement</small>
                      </div>
                    </div>
                  )}

                  {student.governance?.allowedRoles?.length > 0 && (
                    <div className="gov-item full">
                      <div className="gov-label">Allowed Job Roles</div>
                      <div className="gov-value">
                        <div className="tag-list">
                          {student.governance.allowedRoles.map((r, i) => <span key={i} className="gov-tag">{r}</span>)}
                        </div>
                      </div>
                    </div>
                  )}

                  {student.governance?.allowedCategories?.length > 0 && (
                    <div className="gov-item full">
                      <div className="gov-label">Allowed Employment Types</div>
                      <div className="gov-value">
                        <div className="tag-list">
                          {student.governance.allowedCategories.map((c, i) => <span key={i} className="gov-tag category">{c}</span>)}
                        </div>
                      </div>
                    </div>
                  )}

                  {student.globalSettings?.branchRestriction && (
                    <div className="gov-item full warning">
                      <div className="gov-label">Branch Restriction ({student.branch}{student.specialization ? ` - ${student.specialization}` : ""})</div>
                      <div className="gov-value">
                        <AlertTriangle size={14} /> Only allowed to apply for: {student.globalSettings.branchRestriction.allowedRoles.join(", ")}
                      </div>
                    </div>
                  )}
                </div>

                <div className="gov-footer">
                  <ShieldCheck size={14} /> This information is managed by your university's Placement Officer. Contact the PO for eligibility disputes.
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Contact */}
          <div className="side-bar">
            <div className="actions-card card">
              <h3>Take Action</h3>
              <button className="primary-action" onClick={() => window.open(student.resumeData?.url, '_blank')}>
                <FileText size={18} /> View Verified Resume
              </button>
              {currentUser?._id !== student?._id && (
                <button className="secondary-action" onClick={handleContactCandidate}>
                  <Mail size={18} /> Message Candidate
                </button>
              )}
              <button className="po-action" onClick={handleContactPO}>
                <Building2 size={18} /> Contact Placement Office
              </button>
            </div>

            <div className="info-card card">
              <h3>Contact Info</h3>
              <div className="info-list">
                <div className="i-item">
                  <Mail size={16} />
                  <span>{student.email}</span>
                </div>
                <div className="i-item">
                  <Phone size={16} />
                  <span>{student.phone || "Not provided"}</span>
                </div>
              </div>
              <p className="hr-note">Candidate has authorized recruiters to contact them regarding placement opportunities.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CandidateProfile;
