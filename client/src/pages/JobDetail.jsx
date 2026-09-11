import React, { useEffect, useState } from "react";
import "./JobDetail.css";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import newRequest from "../utils/newRequest";
import moment from "moment";
import { FileText, ExternalLink, Download } from "lucide-react";

const JobDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const isApplyMode = new URLSearchParams(location.search).get("apply") === "true";
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    submittedCgpa: "",
    submittedSkills: "",
    resumeUrl: "",
    atsScore: 0,
  });

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await newRequest.get(`/jobs/${id}`);
        setJob(res.data);
        // Pre-fill from current user if they are a student
        if (currentUser?.role === "student") {
          setFormData({
            submittedCgpa: currentUser.graduationYear || "", // Using graduationYear as placeholder for CGPA if not present
            submittedSkills: currentUser.resumeData?.parsedSkills?.join(", ") || "",
            resumeUrl: "", // Do not pre-fill Cloudinary link, let user provide Drive link
            atsScore: currentUser.resumeData?.atsScore || 0,
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isCgpaIneligible = job?.eligibilityCriteria?.cgpaUG > 0 && 
    parseFloat(formData.submittedCgpa) < job.eligibilityCriteria.cgpaUG;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const skillsArray = formData.submittedSkills.split(",").map(s => s.trim()).filter(s => s !== "");
      await newRequest.post("/applications", {
        jobId: id,
        submittedCgpa: parseFloat(formData.submittedCgpa),
        submittedSkills: skillsArray,
        resumeUrl: formData.resumeUrl,
        atsScore: formData.atsScore,
      });
      setMessage({ type: "success", text: "Application submitted successfully!" });
      setTimeout(() => navigate("/my-applications"), 2000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to submit application" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loader">Loading...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!job) return <div className="error-container">Job not found</div>;

  const isStudent = currentUser?.role === "student" && currentUser?.subscription === "business";

  // Centralized Eligibility from API
  const eligibility = job.eligibility || { isEligible: true };
  const eligibilityError = !eligibility.isEligible ? eligibility.message : null;

  return (
    <div className="job-detail">
      <div className="container">
        <div className="job-info-section">
          <div className="job-header-full">
            <div className="title-area">
              <h1>{job.jobRole}</h1>
              <span className="company-badge">{job.companyName}</span>
            </div>
            <div className="meta-area">
              <span className={`status-tag ${job.status}`}>{job.status.toUpperCase()}</span>
              <span className="post-date">Posted {moment(job.createdAt).fromNow()}</span>
            </div>
          </div>

          <div className="job-grid-details">
            <div className="detail-card">
              <h3>Eligibility Criteria</h3>
              <ul>
                <li><strong>CGPA (X/XII/UG):</strong> {job.eligibilityCriteria?.cgpaX || 0} / {job.eligibilityCriteria?.cgpaXII || 0} / {job.eligibilityCriteria?.cgpaUG || 0}</li>
                <li><strong>Backlogs:</strong> {job.eligibilityCriteria?.noArrears ? "No standing arrears" : "Allowed"}</li>
                <li><strong>Eligible Branches:</strong> {job.eligibleBranches?.length > 0 ? (job.eligibleBranches.includes("Any Branch") ? "All branches" : job.eligibleBranches.join(", ")) : "All branches"}</li>
              </ul>
            </div>
            <div className="detail-card">
              <h3>Compensation & Location</h3>
              <ul>
                <li><strong>CTC:</strong> {job.ctc || "N/A"}</li>
                <li><strong>Stipend:</strong> {job.stipend || "N/A"}</li>
                <li><strong>Location:</strong> {job.location || "Remote"}</li>
              </ul>
            </div>
          </div>

          <div className="content-section">
            <h3>Job Description</h3>
            <p className="description-text">{job.jobDescription || "No description provided."}</p>
          </div>

          {job.detailsDocUrl && (
            <div className="content-section attachment-section">
              <h3>Detailed Document</h3>
              <div className="attachment-box">
                <FileText size={24} className="doc-icon" />
                <div className="doc-info">
                  <strong>Job/Company Overview</strong>
                  <span>Detailed description and overview provided by HR.</span>
                </div>
                <a href={job.detailsDocUrl} target="_blank" rel="noopener noreferrer" className="view-doc-btn">
                  <ExternalLink size={18} /> View Document
                </a>
              </div>
            </div>
          )}

          {job.isOnCampus && job.driveSchedule?.length > 0 && (
            <div className="content-section on-campus-schedule">
              <h3 className="on-campus-label">On-Campus Drive Schedule</h3>
              <div className="drive-timeline">
                {job.driveSchedule.map((round, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="round-header">
                      <span className="round-name">{round.roundName}</span>
                      <span className="round-separator"> - </span>
                      <span className={`round-mode ${round.mode.toLowerCase()}`}>{round.mode}</span>
                    </div>
                    <div className="round-body">
                      <span className="round-date">
                        {round.date ? moment(round.date).format("MMMM Do, YYYY") : "TBD"}
                      </span>
                      {round.details && <p className="round-details">{round.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="content-section">
            <h3>Hiring Workflow</h3>
            <p>{job.hiringWorkflow || "Details will be shared soon."}</p>
          </div>

          <div className="content-section">
            <h3>Required Skills</h3>
            <div className="skills-list">
              {job.skillsRequired?.map((skill, index) => (
                <span key={index} className="skill-pill">{skill}</span>
              )) || "Contact HR for details."}
            </div>
          </div>

          <div className="footer-links">
            {job.website && <a href={job.website} target="_blank" rel="noopener noreferrer" className="website-link">Visit Company Website</a>}
            <span className="last-date">Apply before: {job.lastDate ? moment(job.lastDate).format("MMMM Do, YYYY") : "N/A"}</span>
          </div>
        </div>

        {isStudent && isApplyMode && job.status === "active" && (
          <div className="application-section" id="apply-now">
            {eligibilityError ? (
              <div className="restriction-msg">
                <h2>Access Restricted</h2>
                <div className="restriction-alert">
                  <p>{eligibilityError}</p>
                </div>
                {eligibility.reason === "Profile Incomplete" ? (
                  <button className="go-dashboard-btn primary" onClick={() => navigate("/placements")}>Update Profile Branch</button>
                ) : (
                  <button className="go-dashboard-btn" onClick={() => navigate("/job-board")}>Back to Job Board</button>
                )}
              </div>
            ) : job.isApplied ? (
              <div className="already-applied-msg">
                <h2>Application Status</h2>
                <p>You have already applied for this position. You can track your application in the dashboard.</p>
                <button className="go-dashboard-btn" onClick={() => navigate("/my-applications")}>View My Applications</button>
              </div>
            ) : (
              <>
                <h2>Apply for this position</h2>
                <form onSubmit={handleSubmit} className="apply-form">
                  <div className="form-group">
                    <label>Your UG CGPA / Percentage</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="submittedCgpa" 
                      value={formData.submittedCgpa} 
                      onChange={handleChange} 
                      required 
                      placeholder="e.g. 8.5"
                    />
                    {isCgpaIneligible && (
                      <div className="warning-text" style={{color: "#ef4444", fontSize: "0.85rem", marginTop: "5px", fontWeight: "600"}}>
                        ⚠️ Your CGPA ({formData.submittedCgpa}) does not match the job requirement ({job.eligibilityCriteria.cgpaUG}).
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Key Skills (comma separated)</label>
                    <input 
                      type="text" 
                      name="submittedSkills" 
                      value={formData.submittedSkills} 
                      onChange={handleChange} 
                      required 
                      placeholder="React, Node.js, Python"
                    />
                  </div>
                  <div className="form-group">
                    <label>Resume Link (drive link with public access)</label>
                    <input 
                      type="text" 
                      name="resumeUrl" 
                      value={formData.resumeUrl} 
                      onChange={handleChange} 
                      required 
                      placeholder="drive link with public access"
                    />
                  </div>
                  {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
                  <button type="submit" className="submit-application" disabled={submitting || isCgpaIneligible}>
                    {submitting ? "Submitting..." : isCgpaIneligible ? "Not Eligible to Apply" : "Submit Application"}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail;
