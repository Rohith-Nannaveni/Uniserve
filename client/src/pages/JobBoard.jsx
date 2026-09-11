import React, { useEffect, useState } from "react";
import "./JobBoard.css";
import newRequest from "../utils/newRequest";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { Trash2 } from "lucide-react";

const JobBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [universityJobs, setUniversityJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all" or "university"
  
  const [filters, setFilters] = useState({
    role: "",
    company: "",
    category: "all",
    location: "",
  });

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const [jobsRes, uniJobsRes] = await Promise.all([
          newRequest.get("/jobs"),
          (currentUser?.role === "student" && currentUser?.university) 
            ? newRequest.get("/po/university-jobs") 
            : Promise.resolve({ data: [] })
        ]);
        
        setJobs(jobsRes.data);
        setUniversityJobs(uniJobsRes.data);
        setFilteredJobs(jobsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    let result = activeTab === "all" ? jobs : universityJobs;

    if (filters.role) {
      result = result.filter(job => job.jobRole.toLowerCase().includes(filters.role.toLowerCase()));
    }
    if (filters.company) {
      result = result.filter(job => job.companyName.toLowerCase().includes(filters.company.toLowerCase()));
    }
    if (filters.category !== "all") {
      result = result.filter(job => job.category === filters.category);
    }
    if (filters.location) {
      result = result.filter(job => job.location?.toLowerCase().includes(filters.location.toLowerCase()));
    }

    setFilteredJobs(result);
  }, [filters, jobs, universityJobs, activeTab]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleShareJob = async (job) => {
    try {
      await newRequest.post("/po/share-job", { jobId: job._id });
      alert(`Successfully shared "${job.jobRole}" with all students in your university!`);
    } catch (err) {
      alert("Failed to share job. Please try again.");
    }
  };

  const handleDismissShare = async (shareId) => {
    if (!window.confirm("Remove this job from your 'University Shared' history?")) return;
    try {
      await newRequest.patch(`/po/dismiss-share/${shareId}`);
      setUniversityJobs(universityJobs.filter(j => j.shareId !== shareId));
    } catch (err) {
      console.error(err);
      alert("Failed to dismiss job.");
    }
  };

  if (loading) return <div className="loader">Loading...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="job-board">
      <div className="container">
        <div className="header">
          <h1>Explore Job Opportunities</h1>
          <p>Exclusive for Business Tier students & Placement Officers</p>
        </div>

        {currentUser?.role === "student" && currentUser?.university && (
          <div className="job-board-tabs" style={{display: "flex", gap: "20px", marginBottom: "20px", borderBottom: "1px solid #eee"}}>
            <button 
              onClick={() => setActiveTab("all")}
              style={{
                padding: "10px 20px",
                border: "none",
                background: "none",
                borderBottom: activeTab === "all" ? "2px solid #1a2a47" : "none",
                color: activeTab === "all" ? "#1a2a47" : "#666",
                fontWeight: activeTab === "all" ? "bold" : "normal",
                cursor: "pointer"
              }}
            >
              All Jobs
            </button>
            <button 
              onClick={() => setActiveTab("university")}
              style={{
                padding: "10px 20px",
                border: "none",
                background: "none",
                borderBottom: activeTab === "university" ? "2px solid #1a2a47" : "none",
                color: activeTab === "university" ? "#1a2a47" : "#666",
                fontWeight: activeTab === "university" ? "bold" : "normal",
                cursor: "pointer"
              }}
            >
              University Shared
            </button>
          </div>
        )}

        {currentUser?.role === "student" && !currentUser?.university && (
          <div className="unlinked-university-banner" style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "15px 20px",
            borderRadius: "12px",
            marginBottom: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#1e40af"
          }}>
            <p style={{margin: 0, fontSize: "14px"}}>
              <strong>Note:</strong> You haven't linked your university yet. Link your university in your profile to access exclusive campus drives and university-shared opportunities.
            </p>
            <button 
              onClick={() => navigate("/placements")}
              style={{
                background: "#1e40af",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "bold",
                cursor: "pointer"
              }}
            >
              Link Now
            </button>
          </div>
        )}

        <div className="job-filters-bar">
          <div className="filter-input-group">
            <label>Role</label>
            <input type="text" name="role" value={filters.role} onChange={handleFilterChange} placeholder="Search Role..." />
          </div>
          <div className="filter-input-group">
            <label>Company</label>
            <input type="text" name="company" value={filters.company} onChange={handleFilterChange} placeholder="Search Company..." />
          </div>
          <div className="filter-input-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="all">All Categories</option>
              <option value="Full Time">Full Time</option>
              <option value="Regular Internship">Regular Internship</option>
              <option value="Internship + PPO">Internship + PPO</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
          <div className="filter-input-group">
            <label>Location</label>
            <input type="text" name="location" value={filters.location} onChange={handleFilterChange} placeholder="Search Location..." />
          </div>
        </div>

        <div className="job-grid">
          {filteredJobs.length === 0 ? (
            <p className="no-jobs">No matching job postings found.</p>
          ) : (
            filteredJobs.map((job) => (
              <div key={job._id} className="job-card" style={{position: "relative"}}>
                {job.sharedBy && (
                  <div className="university-badge" style={{
                    position: "absolute",
                    top: "-10px",
                    right: "-10px",
                    background: "#f59e0b",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: "20px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                    zIndex: 1
                  }}>
                    ⭐ Shared by University
                  </div>
                )}
                {activeTab === "university" && (
                  <button 
                    className="dismiss-job-btn" 
                    onClick={() => handleDismissShare(job.shareId)}
                    title="Dismiss from history"
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "#fee2e2",
                      color: "#ef4444",
                      border: "1px solid #fecaca",
                      padding: "5px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <div className="job-header">
                  <div className="title-row">
                    <h3>{job.jobRole}</h3>
                    <span className={`job-type-badge ${job.isOnCampus ? "on-campus" : "off-campus"}`}>
                      {job.isOnCampus ? "On-Campus" : "Off-Campus"}
                    </span>
                  </div>
                  <span className="company-name">{job.companyName}</span>
                  {job.sharedBy && (
                    <span className="shared-by" style={{fontSize: "12px", color: "#666", marginTop: "5px", display: "block"}}>
                      Shared by PO: <strong>{job.sharedBy}</strong>
                    </span>
                  )}
                </div>
                <div className="job-details">
                  <div className="detail-item">
                    <strong>Location:</strong> {job.location || "Remote"}
                  </div>
                  <div className="detail-item">
                    <strong>CTC/Stipend:</strong> {job.ctc || job.stipend || "Not specified"}
                  </div>
                  <div className="detail-item">
                    <strong>Category:</strong> {job.category || "General"}
                  </div>
                  <div className="detail-item">
                    <strong>Apply By:</strong> {job.lastDate ? moment(job.lastDate).format("MMM DD, YYYY") : "N/A"}
                  </div>
                </div>
                <div className="job-skills">
                  {job.skillsRequired?.slice(0, 3).map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                  {job.skillsRequired?.length > 3 && <span className="more-skills">+{job.skillsRequired.length - 3}</span>}
                </div>
                
                <div className="job-card-actions" style={{display: "flex", gap: "10px", marginTop: "15px"}}>
                  <button 
                    className="view-btn" 
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #1a2a47",
                      background: "white",
                      color: "#1a2a47",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                    onClick={() => navigate(`/job/${job._id}`)}
                  >
                    View Details
                  </button>
                  
                  {currentUser?.role === "po" ? (
                    <button 
                      className="share-btn" 
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "6px",
                        border: "none",
                        background: "#1a2a47",
                        color: "white",
                        fontWeight: "600",
                        cursor: "pointer"
                      }}
                      onClick={() => handleShareJob(job)}
                    >
                      Share with Students
                    </button>
                  ) : (() => {
                    // Centralized Eligibility Check from API
                    const eligibility = job.eligibility || { isEligible: true };
                    const isRestricted = !eligibility.isEligible;
                    const restrictionReason = eligibility.reason || "";

                    return (
                      <button 
                        className={`apply-btn ${job.isApplied ? "applied" : job.isClosed ? "closed" : isRestricted ? "restricted" : ""}`} 
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: "6px",
                          border: "none",
                          background: (job.isApplied || job.isClosed || isRestricted) ? "#eee" : "#1dbf73",
                          color: (job.isApplied || job.isClosed) ? "#999" : isRestricted ? "#ef4444" : "white",
                          fontWeight: "600",
                          cursor: (job.isApplied || job.isClosed || isRestricted) ? "default" : "pointer",
                          fontSize: isRestricted ? "12px" : "14px"
                        }}
                        onClick={() => !job.isClosed && !isRestricted && navigate(`/job/${job._id}?apply=true`)}
                        disabled={job.isApplied || job.isClosed || isRestricted}
                        title={eligibility.message}
                      >
                        {job.isApplied ? "Applied" : job.isClosed ? "Closed" : isRestricted ? `Restricted (${restrictionReason})` : "Apply Now"}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default JobBoard;
