import React, { useEffect, useState } from "react";
import "./ManageJobs.css";
import newRequest from "../utils/newRequest";
import { useNavigate, useLocation } from "react-router-dom";
import moment from "moment";
import { Plus, X, Calendar, MapPin, ShieldCheck, Upload, FileText } from "lucide-react";
import upload from "../utils/upload";

const STANDARDIZED_BRANCHES = [
  "Any Branch",
  "Computer Science Engineering and related",
  "Electronics Communication Engineering and related",
  "Electrical Electronics Engineering and related",
  "Mechanical Engineering and related",
  "Civil Engineering and related",
  "Other"
];

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const [formData, setFormData] = useState({
    companyName: "",
    category: "Full Time",
    jobRole: "",
    jobDescription: "",
    ctc: "",
    stipend: "",
    location: "",
    lastDate: "",
    website: "",
    hiringWorkflow: "",
    eligibleBranches: ["Any Branch"],
    otherBranchText: "",
    skillsRequired: "",
    cgpaX: 0,
    cgpaXII: 0,
    cgpaUG: 0,
    noArrears: false,
    isOnCampus: false,
    exclusivePO: null,
    proposalId: null,
    detailsDocUrl: "",
    restrictions: {
      restrict2X: false,
      onlyUnplaced: false,
      typeRestriction: "None"
    }
  });

  const [driveSchedule, setDriveSchedule] = useState([
    { roundName: "Online Assessment", mode: "Virtual", date: "", details: "" }
  ]);

  const [partners, setPartners] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (location.state?.isOnCampus) {
      setShowAddForm(true);
      setFormData(prev => ({
        ...prev,
        isOnCampus: true,
        exclusivePO: location.state.exclusivePO,
        proposalId: location.state.proposalId,
        companyName: location.state.companyName || "",
        universityName: location.state.universityName
      }));
    }
    fetchJobs();
    fetchPartners();
  }, [location]);

  const fetchPartners = async () => {
    try {
      const res = await newRequest.get("/proposals/accepted");
      // Deduplicate by PO ID
      const uniquePartners = [];
      const seenPOs = new Set();
      (res.data || []).forEach(p => {
        if (p.poId?._id && !seenPOs.has(p.poId._id)) {
          seenPOs.add(p.poId._id);
          uniquePartners.push(p);
        }
      });
      setPartners(uniquePartners);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await newRequest.get("/jobs/hr");
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("restrictions.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        restrictions: {
          ...prev.restrictions,
          [field]: type === "checkbox" ? checked : value
        }
      }));
    } else if (name === "eligibleBranches") {
      const branch = value;
      let newBranches = [...formData.eligibleBranches];
      
      if (checked) {
        if (branch === "Any Branch") {
          newBranches = ["Any Branch"];
        } else {
          newBranches = newBranches.filter(b => b !== "Any Branch");
          newBranches.push(branch);
        }
      } else {
        newBranches = newBranches.filter(b => b !== branch);
        if (newBranches.length === 0) newBranches = ["Any Branch"];
      }
      
      setFormData({ ...formData, eligibleBranches: newBranches });
    } else {
      setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const url = await upload(file);
      setFormData(prev => ({ ...prev, detailsDocUrl: url }));
      alert("Job details document uploaded successfully!");
    } catch (err) {
      alert("Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRoundChange = (index, field, value) => {
    const newSchedule = [...driveSchedule];
    newSchedule[index][field] = value;
    setDriveSchedule(newSchedule);
  };

  const addRound = () => {
    setDriveSchedule([...driveSchedule, { roundName: "", mode: "Virtual", date: "", details: "" }]);
  };

  const removeRound = (index) => {
    setDriveSchedule(driveSchedule.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalBranches = [...formData.eligibleBranches];
      if (finalBranches.includes("Other") && formData.otherBranchText) {
        finalBranches = finalBranches.filter(b => b !== "Other");
        finalBranches.push(formData.otherBranchText);
      }

      const payload = {
        ...formData,
        eligibleBranches: finalBranches,
        skillsRequired: typeof formData.skillsRequired === 'string' ? formData.skillsRequired.split(",").map(s => s.trim()).filter(s => s !== "") : formData.skillsRequired,
        eligibilityCriteria: {
          cgpaX: parseFloat(formData.cgpaX),
          cgpaXII: parseFloat(formData.cgpaXII),
          cgpaUG: parseFloat(formData.cgpaUG),
          noArrears: formData.noArrears,
        },
        driveSchedule: formData.isOnCampus ? driveSchedule : []
      };
      await newRequest.post("/jobs", payload);
      setShowAddForm(false);
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      try {
        await newRequest.delete(`/jobs/${id}`);
        fetchJobs();
      } catch (err) {
        alert("Failed to delete job");
      }
    }
  };

  return (
    <div className="manage-jobs">
      <div className="container">
        <div className="header">
          <h1>Manage Job Openings</h1>
          <button 
            className="add-job-btn" 
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={currentUser?.reliabilityStatus === "suspended"}
          >
            {showAddForm ? "Cancel" : "+ Post New Job"}
          </button>
        </div>

        {showAddForm && (
          <div className="job-form-card">
            <h2>Post a New Opportunity</h2>
            <form onSubmit={handleSubmit} className="job-post-form">
              {formData.isOnCampus && (
                <div className="on-campus-banner">
                  <ShieldCheck size={20} />
                  <span>Exclusive On-Campus Drive for <strong>{formData.universityName}</strong></span>
                </div>
              )}
              
              <div className="form-row">
                <div className="form-group">
                  <label>On-Campus Drive?</label>
                  <div className="checkbox-wrapper">
                    <input type="checkbox" name="isOnCampus" checked={formData.isOnCampus} onChange={handleChange} />
                    <span>Yes, this is an institutional drive</span>
                  </div>
                </div>
                {formData.isOnCampus && !location.state?.isOnCampus && (
                  <div className="form-group">
                    <label>Select Target University (Partners)</label>
                    <select 
                      name="exclusivePO" 
                      value={formData.exclusivePO || ""} 
                      onChange={(e) => {
                        const partner = partners.find(p => p.poId?._id === e.target.value);
                        setFormData({
                          ...formData,
                          exclusivePO: e.target.value,
                          proposalId: partner?._id || null,
                          universityName: partner?.poId?.university || partner?.poId?.username || "Unknown University"
                        });
                      }}
                      required
                    >
                      <option value="">-- Select University --</option>
                      {partners.map(p => (
                        <option key={p._id} value={p.poId?._id}>
                          {p.poId?.university || p.poId?.username || "Unknown University"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Company Name</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Job Role</label>
                  <input type="text" name="jobRole" value={formData.jobRole} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="Full Time">Full Time</option>
                    <option value="Regular Internship">Regular Internship</option>
                    <option value="Internship + PPO">Internship + PPO</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Hyderabad, Remote" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>CTC (Annual)</label>
                  <input type="text" name="ctc" value={formData.ctc} onChange={handleChange} placeholder="e.g. 12 LPA" />
                </div>
                <div className="form-group">
                  <label>Stipend (Monthly)</label>
                  <input type="text" name="stipend" value={formData.stipend} onChange={handleChange} placeholder="e.g. 25000" />
                </div>
              </div>

              <div className="form-group">
                <label>Job Description</label>
                <textarea name="jobDescription" value={formData.jobDescription} onChange={handleChange} rows="4" required />
              </div>

              <div className="form-group doc-upload-group">
                <label>Detailed Job/Company Document (Optional - PDF)</label>
                <div className="doc-upload-box">
                  <input type="file" id="job-doc" accept=".pdf" onChange={handleDocUpload} disabled={uploadingDoc} hidden />
                  <label htmlFor="job-doc" className={`doc-upload-label ${formData.detailsDocUrl ? "uploaded" : ""}`}>
                    {uploadingDoc ? (
                      "Uploading..."
                    ) : formData.detailsDocUrl ? (
                      <>
                        <FileText size={18} /> Document Attached
                      </>
                    ) : (
                      <>
                        <Upload size={18} /> Attach JD/Company Profile
                      </>
                    )}
                  </label>
                  {formData.detailsDocUrl && (
                    <button type="button" className="remove-doc-btn" onClick={() => setFormData(prev => ({ ...prev, detailsDocUrl: "" }))}>
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Hiring Workflow</label>
                <input type="text" name="hiringWorkflow" value={formData.hiringWorkflow} onChange={handleChange} placeholder="e.g. Assessment, Interview, HR Round" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Skills Required (comma separated)</label>
                  <input type="text" name="skillsRequired" value={formData.skillsRequired} onChange={handleChange} placeholder="e.g. React, Python" />
                </div>
              <div className="form-group">
                <label>Eligible Branches</label>
                <div className="branches-multi-select">
                  {STANDARDIZED_BRANCHES.map((branch) => (
                    <div key={branch} className="branch-option">
                      <input 
                        type="checkbox" 
                        id={`branch-${branch}`}
                        name="eligibleBranches"
                        value={branch}
                        checked={formData.eligibleBranches.includes(branch)}
                        onChange={handleChange}
                      />
                      <label htmlFor={`branch-${branch}`}>{branch}</label>
                    </div>
                  ))}
                </div>
                {formData.eligibleBranches.includes("Other") && (
                  <input 
                    type="text" 
                    name="otherBranchText" 
                    className="other-branch-input"
                    value={formData.otherBranchText} 
                    onChange={handleChange} 
                    placeholder="Enter manual branch (e.g. Chemical Engineering)"
                    required
                  />
                )}
              </div>
              </div>

              <div className="eligibility-box">
                <h4>Minimum Eligibility Criteria</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Min X %</label>
                    <input type="number" step="0.1" name="cgpaX" value={formData.cgpaX} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Min XII %</label>
                    <input type="number" step="0.1" name="cgpaXII" value={formData.cgpaXII} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Min UG CGPA</label>
                    <input type="number" step="0.1" name="cgpaUG" value={formData.cgpaUG} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-checkbox">
                  <input type="checkbox" name="noArrears" checked={formData.noArrears} onChange={handleChange} />
                  <label>No Standing Arrears Required</label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Last Date to Apply</label>
                  <input type="date" name="lastDate" value={formData.lastDate} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Company Website</label>
                  <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://company.com" />
                </div>
              </div>

              {formData.isOnCampus && (
                <div className="schedule-box">
                  <div className="schedule-header">
                    <h4>On-Campus Drive Schedule</h4>
                    <button type="button" onClick={addRound} className="add-round-btn"><Plus size={14}/> Add Round</button>
                  </div>
                  {driveSchedule.map((round, index) => (
                    <div key={index} className="schedule-row">
                      <div className="round-main">
                        <input 
                          placeholder="Round Name (e.g. Technical Interview)" 
                          value={round.roundName} 
                          onChange={(e) => handleRoundChange(index, "roundName", e.target.value)}
                          required
                        />
                        <select value={round.mode} onChange={(e) => handleRoundChange(index, "mode", e.target.value)}>
                          <option value="Virtual">Virtual</option>
                          <option value="In-person">In-person</option>
                        </select>
                        <input 
                          type="date" 
                          value={round.date} 
                          onChange={(e) => handleRoundChange(index, "date", e.target.value)} 
                        />
                        {driveSchedule.length > 1 && (
                          <button type="button" className="remove-round" onClick={() => removeRound(index)}><X size={16}/></button>
                        )}
                      </div>
                      <textarea 
                        placeholder="Round details, venue or meeting link..." 
                        value={round.details} 
                        onChange={(e) => handleRoundChange(index, "details", e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <button 
                type="submit" 
                className="submit-job-btn" 
                disabled={submitting || currentUser?.reliabilityStatus === "suspended"}
              >
                {submitting ? "Processing..." : "Publish Job Posting"}
              </button>
            </form>
          </div>
        )}

        <div className="jobs-list">
          <h2>Your Active Postings</h2>
          {loading ? (
            <p>Loading jobs...</p>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <p>You haven't posted any jobs yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Category</th>
                    <th>Applicants</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job._id}>
                      <td>
                        <div className="job-title-cell">
                          <strong>{job.jobRole}</strong>
                          <span>{job.companyName}</span>
                        </div>
                      </td>
                      <td>{job.category}</td>
                      <td>
                        <div className="applicants-cell">
                          <button className="view-apps-link" onClick={() => navigate(`/manage-applicants/${job._id}`)}>
                            View Applicants
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${job.status}`}>{job.status}</span>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="view-details-btn" onClick={() => navigate(`/job/${job._id}`)}>
                            View Details
                          </button>
                          <button 
                            className="delete-btn" 
                            onClick={() => handleDelete(job._id)}
                            disabled={currentUser?.reliabilityStatus === "suspended"}
                          >Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageJobs;
