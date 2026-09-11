import React, { useState, useEffect } from "react";
import "./CareerAI.css";
import newRequest from "../utils/newRequest";
import { Upload, FileText, CheckCircle, AlertCircle, BarChart3, Target, Sparkles, Loader2, Briefcase, GraduationCap, Lightbulb } from "lucide-react";

function CareerAI() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Entry-level");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem("currentUser")));

  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const res = await newRequest.get("/career/resume");
        setResumeData(res.data);
      } catch (err) {
        console.log("No previous resume data found.");
      }
    };
    fetchResumeData();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return setError("Please select a file first.");
    
    setUploading(true);
    setError(null);

    try {
      const { default: upload } = await import("../utils/upload");
      const url = await upload(file);
      
      setUploading(false);
      setAnalyzing(true);

      const res = await newRequest.post("/career/analyze", { 
        resumeUrl: url,
        jobDescription,
        targetRole,
        experienceLevel
      });
      setResumeData(res.data);
      setAnalyzing(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Analysis failed. Please try again.");
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#1dbf73";
    if (score >= 60) return "#f1c40f";
    return "#e74c3c";
  };

  return (
    <div className="career-ai">
      <div className="container">
        <header className="ai-header">
          <h1><Sparkles size={32} color="#1dbf73" /> Career <span>AI</span></h1>
          <p>Optimize your resume with our Gemini-powered ATS Analysis Engine.</p>
        </header>

        <div className="ai-grid">
          <div className="ai-upload-card card">
            <h2>Analyze New Resume</h2>
            
            <div className={`upload-zone ${file ? 'has-file' : ''}`}>
              <input type="file" id="resume-upload" onChange={handleFileChange} hidden accept=".pdf" />
              <label htmlFor="resume-upload">
                <Upload size={48} color={file ? "#1dbf73" : "#94a3b8"} />
                {file ? (
                  <div className="file-info">
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <p>Click to upload or drag & drop PDF resume</p>
                )}
              </label>
            </div>

            {/* Optional Fields for Premium/Business */}
            {(currentUser?.subscription === "premium" || currentUser?.subscription === "business") && (
              <div className="optional-fields">
                <div className="field-group">
                  <label><Briefcase size={16} /> Target Role (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Full Stack Developer" 
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                </div>
                
                <div className="field-group">
                  <label><GraduationCap size={16} /> Experience Level</label>
                  <select 
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                  >
                    <option value="Entry-level">Entry-level</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>

                <div className="field-group">
                  <label><FileText size={16} /> Job Description (Optional)</label>
                  <textarea 
                    placeholder="Paste the JD here for targeted analysis..." 
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <button 
              className="analyze-btn" 
              onClick={handleAnalyze} 
              disabled={uploading || analyzing || !file}
            >
              {uploading ? (
                <><Loader2 className="animate-spin" size={20} /> Uploading...</>
              ) : analyzing ? (
                <><Loader2 className="animate-spin" size={20} /> AI Analyzing...</>
              ) : (
                <>Start AI Analysis</>
              )}
            </button>
            {error && <p className="error-msg"><AlertCircle size={16} /> {error}</p>}
          </div>

          {resumeData && !analyzing && (
            <div className="ai-results-card card">
              <div className="score-section">
                <div className="score-circle-wrapper">
                  <div 
                    className="score-circle" 
                    style={{ 
                      background: `conic-gradient(${getScoreColor(resumeData.atsScore)} ${resumeData.atsScore * 3.6}deg, #f1f5f9 0deg)` 
                    }}
                  >
                    <div className="score-inner">
                      <span className="score-num">{resumeData.atsScore}</span>
                      <span className="score-label">ATS Score</span>
                    </div>
                  </div>
                </div>
                <div className="score-meta">
                  <h3>Analysis Complete!</h3>
                  {resumeData.gapAnalysis?.roleFitScore > 0 && (
                    <div className="role-fit">
                      <BarChart3 size={16} color="#3b82f6" />
                      <span>Role Fit: <strong>{resumeData.gapAnalysis.roleFitScore}%</strong></span>
                    </div>
                  )}
                  <p>Your resume has been evaluated based on recruiter benchmarks and industry keywords.</p>
                </div>
              </div>

              <div className="results-tabs">
                {/* Gap Analysis Section */}
                {resumeData.gapAnalysis && (resumeData.gapAnalysis.missingSkills.length > 0 || resumeData.gapAnalysis.focusAreas.length > 0) && (
                  <div className="tab-section gap-analysis">
                    <h3><Lightbulb size={20} color="#f59e0b" /> Targeted Insights</h3>
                    
                    {resumeData.gapAnalysis.missingSkills.length > 0 && (
                      <div className="gap-sub-section">
                        <h4>What to Learn:</h4>
                        <div className="skills-tags">
                          {resumeData.gapAnalysis.missingSkills.map((skill, i) => (
                            <span key={i} className="skill-tag learning">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {resumeData.gapAnalysis.focusAreas.length > 0 && (
                      <div className="gap-sub-section">
                        <h4>Improvement Focus:</h4>
                        <ul className="tips-list">
                          {resumeData.gapAnalysis.focusAreas.map((area, i) => (
                            <li key={i}><div className="bullet yellow" /> {area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="tab-section">
                  <h3><Target size={20} color="#3b82f6" /> General Improvement Tips</h3>
                  <ul className="tips-list">
                    {resumeData.tips?.map((tip, i) => (
                      <li key={i}><div className="bullet" /> {tip}</li>
                    ))}
                  </ul>
                </div>

                <div className="tab-section">
                  <h3><FileText size={20} color="#1dbf73" /> Parsed Skills</h3>
                  <div className="skills-tags">
                    {resumeData.parsedSkills?.map((skill, i) => (
                      <span key={i} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CareerAI;
