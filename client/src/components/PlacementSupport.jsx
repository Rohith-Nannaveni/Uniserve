import React, { useState, useEffect } from "react";
import newRequest from "../utils/newRequest";
import upload from "../utils/upload";
import { ShieldCheck, XCircle, FilePlus, ExternalLink, Eye, Briefcase, FileText } from "lucide-react";
import "./PlacementSupport.css";
import { useNavigate } from "react-router-dom";

const PlacementSupport = () => {
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem("currentUser")));
  const [universities, setUniversities] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlacementReady, setIsPlacementReady] = useState(currentUser.isPlacementReady);
  const [manualUniv, setManualUniv] = useState("");
  const navigate = useNavigate();
  const [verificationData, setVerificationData] = useState({
    university: currentUser.university || "",
    graduationYear: currentUser.graduationYear || "",
    collegeId: "",
    transcripts: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [univRes, hrRes] = await Promise.all([
          newRequest.get("/hr/universities"),
          newRequest.get("/hr/directory") // Updated endpoint for verified visible HRs
        ]);
        setUniversities(univRes.data);
        setHrs(hrRes.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMessageHR = async (hrId) => {
    try {
      const res = await newRequest.post("/conversations", { to: hrId });
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      alert("Failed to initiate chat.");
    }
  };

  const handleUpload = async (e, field) => {
    const files = e.target.files;
    if (!files) return;
    
    try {
      if (field === "transcripts") {
        const urls = await Promise.all([...files].map(file => upload(file)));
        setVerificationData(prev => ({ ...prev, transcripts: [...prev.transcripts, ...urls] }));
      } else {
        const url = await upload(files[0]);
        setVerificationData(prev => ({ ...prev, [field]: url }));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalUniv = verificationData.university === "other" ? manualUniv : verificationData.university;
      await newRequest.post("/career/verify", {
        type: currentUser.subscription === "business" ? "business" : "premium",
        university: finalUniv,
        graduationYear: verificationData.graduationYear,
        proofs: {
          collegeId: verificationData.collegeId,
          transcripts: verificationData.transcripts
        }
      });
      alert("Verification documents submitted! Admin will review them.");
    } catch (err) {
      alert(err.response?.data || "Submission failed.");
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const res = await newRequest.patch("/career/placement-ready");
      setIsPlacementReady(res.data.isPlacementReady);
      const updatedUser = { ...currentUser, isPlacementReady: res.data.isPlacementReady };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      alert(`Profile is now ${res.data.isPlacementReady ? "public to HRs" : "hidden from HRs"}`);
    } catch (err) {
      alert(err.response?.data || "Toggle failed.");
    }
  };

  if (loading) return <div>Loading...</div>;

  const vStatus = currentUser.studentVerification?.status || "none";

  return (
    <div className="placement-support-container">
      <div className="section-header">
        <h2>Placement Support Hub</h2>
        <p>Verified Business Tier users can be discovered by recruiters.</p>
      </div>

      <div className="placement-grid">
        <div className="status-card card">
          <h3>Verification Status</h3>
          <div className={`status-badge ${vStatus}`}>
            {vStatus === "approved" ? <ShieldCheck color="#10b981" /> : <XCircle color="#ef4444" />}
            <span>{vStatus.toUpperCase()}</span>
          </div>
          {vStatus === "rejected" && (
            <div className="rejection-reason">
              <strong>Admin Note:</strong> {currentUser.studentVerification?.rejectionReason}
            </div>
          )}
        </div>

        {vStatus === "approved" && currentUser.subscription === "business" && (
          <div className="visibility-card card">
            <h3>HR Visibility</h3>
            <p>Allow verified HRs to find and contact you for job opportunities.</p>
            <div className="toggle-wrapper">
              <span>Profile Public?</span>
              <label className="switch">
                <input type="checkbox" checked={isPlacementReady} onChange={handleToggleVisibility} />
                <span className="slider round"></span>
              </label>
            </div>
            <button 
              className="preview-btn-hub" 
              onClick={() => navigate(`/candidate/${currentUser?._id}`)} 
              style={{
                marginTop: "15px", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                gap: "8px", 
                border: "2px solid #0f172a", 
                background: "white", 
                color: "#0f172a",
                padding: "12px 15px", 
                borderRadius: "12px", 
                cursor: "pointer",
                fontWeight: "700",
                width: "100%",
                transition: "all 0.2s"
              }}
            >
              <Eye size={16} /> Preview Hiring Profile
            </button>
          </div>
        )}

        {vStatus === "approved" && currentUser.subscription === "business" && (
          <div className="job-portal-card card" style={{ gridColumn: "span 2", marginTop: "20px" }}>
            <h3>Direct Recruitment Portal</h3>
            <p>Apply for verified job openings and track your application status.</p>
            <div className="job-actions" style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
              <button onClick={() => navigate("/job-board")} className="action-btn navy" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <Briefcase size={20} /> Browse Job Board
              </button>
              <button onClick={() => navigate("/my-applications")} className="action-btn emerald" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <FileText size={20} /> My Applications
              </button>
            </div>
          </div>
        )}

        {vStatus === "approved" && currentUser.subscription === "business" && hrs.length > 0 && (
          <div className="corporate-directory-card card" style={{ gridColumn: "span 2", marginTop: "20px" }}>
            <div className="header-with-icon" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
              <ShieldCheck color="#3b82f6" />
              <h3>Verified Corporate Directory</h3>
            </div>
            <p>Connect with verified HRs from top companies who have made their profiles visible.</p>
            <div className="hr-list-student" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "15px", marginTop: "20px" }}>
              {hrs.map(hr => (
                <div key={hr._id} className="hr-mini-card" style={{ padding: "15px", border: "1px solid #e2e8f0", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc" }}>
                  <div className="hr-info">
                    <strong style={{ display: "block", color: "#1e293b" }}>{hr.hrVerification?.companyName}</strong>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{hr.username}</span>
                  </div>
                  <button 
                    onClick={() => handleMessageHR(hr._id)}
                    className="msg-hr-btn"
                    style={{ background: "#1dbf73", color: "white", border: "none", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center" }}
                  >
                    <FileText size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {(vStatus === "none" || vStatus === "rejected") && (
        <div className="verification-form-container card">
          <h3>Apply for Placement Verification</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select University</label>
              <select 
                value={verificationData.university} 
                onChange={(e) => setVerificationData(prev => ({ ...prev, university: e.target.value }))}
                required
              >
                <option value="">Choose University</option>
                {universities.map(u => <option key={u} value={u}>{u}</option>)}
                <option value="other">My University is not listed</option>
              </select>
              {verificationData.university === "other" && (
                <input 
                  type="text" 
                  placeholder="Type your University name" 
                  onChange={(e) => setManualUniv(e.target.value)}
                  required 
                />
              )}
            </div>

            <div className="form-group">
              <label>Graduation Year</label>
              <input 
                type="number" 
                placeholder="2024" 
                value={verificationData.graduationYear}
                onChange={(e) => setVerificationData(prev => ({ ...prev, graduationYear: e.target.value }))}
                required 
              />
            </div>

            <div className="upload-group">
              <label>College ID Card (Optional)</label>
              <input type="file" onChange={(e) => handleUpload(e, "collegeId")} />
              {verificationData.collegeId && <span className="upload-success">Uploaded!</span>}
            </div>

            {currentUser.subscription === "business" && (
              <div className="upload-group">
                <label>Academic Transcripts (All Semesters PDF)</label>
                <input type="file" multiple onChange={(e) => handleUpload(e, "transcripts")} />
                <div className="transcript-count">{verificationData.transcripts.length} files uploaded</div>
              </div>
            )}

            <button type="submit" className="action-btn emerald">Submit for Verification</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PlacementSupport;
