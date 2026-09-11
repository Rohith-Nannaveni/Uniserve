import React, { useState, useEffect } from "react";
import newRequest from "../utils/newRequest";
import upload from "../utils/upload";
import { FileText, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import "./CareerAI.css";

const CareerAI = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("entry");

  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("currentUser");
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      return null;
    }
  })();

  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const res = await newRequest.get("/career/resume");
        setResumeData(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchResumeData();
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      const url = await upload(file);
      const res = await newRequest.post("/career/analyze", { 
        resumeUrl: url,
        jobDescription: jobDescription.trim() || undefined,
        targetRole: targetRole.trim() || undefined,
        experienceLevel: targetRole.trim() ? experienceLevel : undefined
      });
      setResumeData(res.data);
      alert("Analysis complete!");
    } catch (err) {
      alert(err.response?.data || "Analysis failed. Ensure GEMINI_API_KEY is set.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="career-ai-container">
      <div className="section-header">
        <h2>Career AI: Resume Optimization</h2>
        <p>Get your ATS score and personalized tips to increase your hiring chances.</p>
      </div>

      <div className="career-grid">
        <div className="upload-section card">
          <h3>Analyze Your Resume</h3>
          <form onSubmit={handleAnalyze}>
            <div className="file-input-wrapper">
              <input 
                type="file" 
                onChange={(e) => setFile(e.target.files[0])} 
                accept=".pdf,.docx"
                required 
              />
              <FileText size={40} className="icon" />
              <span>{file ? file.name : "Click to select PDF/DOCX"}</span>
            </div>

            <div className="optional-inputs">
              <div className="input-group">
                <label>Target Role (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Full Stack Developer, Data Analyst"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                />
              </div>

              {targetRole.trim() && (
                <div className="input-group">
                  <label>Experience Level</label>
                  <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                    <option value="entry">Entry Level / Fresher</option>
                    <option value="junior">Junior (1-2 years)</option>
                    <option value="mid">Mid-Level (3-5 years)</option>
                    <option value="senior">Senior (5+ years)</option>
                  </select>
                </div>
              )}

              <div className="input-group">
                <label>Job Description (Optional)</label>
                <textarea 
                  placeholder="Paste the Job Description here for detailed comparison..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading || !file} className="action-btn emerald">
              {loading ? "Analyzing with AI..." : "Analyze Resume"}
            </button>
          </form>
          {resumeData?.url && (
            <div className="current-resume">
              <a href={resumeData.url} target="_blank" rel="noreferrer">View Current Resume</a>
            </div>
          )}
        </div>

        {resumeData && (
          <div className="stats-section">
            <div className="score-card card">
              <div className="score-circle">
                <span className="number">{resumeData.atsScore}</span>
                <span className="label">ATS Score</span>
              </div>
              <div className="status">
                {resumeData.atsScore >= 80 ? (
                  <span className="excellent"><CheckCircle size={16}/> Excellent</span>
                ) : resumeData.atsScore >= 50 ? (
                  <span className="good"><TrendingUp size={16}/> Good</span>
                ) : (
                  <span className="poor"><AlertCircle size={16}/> Needs Improvement</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {resumeData && (
        <div className="analysis-results">
          <div className="tips-section card">
            <h3>AI Optimization Tips</h3>
            <ul>
              {resumeData.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="skills-section card">
            <h3>Identified Skills</h3>
            <div className="skills-tags">
              {resumeData.parsedSkills.map((skill, i) => (
                <span key={i} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>

          {resumeData.gapAnalysis && (resumeData.gapAnalysis.missingSkills?.length > 0 || resumeData.gapAnalysis.focusAreas?.length > 0) && (
            <div className="gap-analysis-section card" style={{ gridColumn: "span 2", borderTop: "4px solid #f59e0b" }}>
              <div className="analysis-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3>AI Career Gap Analysis</h3>
                {resumeData.gapAnalysis.roleFitScore > 0 && (
                  <div className="fit-score" style={{ background: "#fef3c7", padding: "8px 15px", borderRadius: "20px", fontWeight: "700", color: "#d97706" }}>
                    Match Score: {resumeData.gapAnalysis.roleFitScore}%
                  </div>
                )}
              </div>
              
              <div className="gap-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
                <div className="missing-skills">
                  <h4 style={{ color: "#b91c1c", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle size={18} /> What more you should learn
                  </h4>
                  <ul style={{ paddingLeft: "20px", color: "#4b5563" }}>
                    {resumeData.gapAnalysis.missingSkills.map((skill, i) => (
                      <li key={i} style={{ marginBottom: "8px" }}>{skill}</li>
                    ))}
                  </ul>
                </div>
                <div className="focus-areas">
                  <h4 style={{ color: "#0369a1", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <TrendingUp size={18} /> Key areas to concentrate on
                  </h4>
                  <ul style={{ paddingLeft: "20px", color: "#4b5563" }}>
                    {resumeData.gapAnalysis.focusAreas.map((area, i) => (
                      <li key={i} style={{ marginBottom: "8px" }}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CareerAI;
