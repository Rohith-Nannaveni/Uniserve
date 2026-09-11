import React, { useState, useEffect } from "react";
import "./HRSearch.css";
import newRequest from "../utils/newRequest";
import { Search, Filter, GraduationCap, Star, User, Building2, MessageSquare, Briefcase, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

function HRSearch() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    university: "",
    skill: "",
    minAts: ""
  });
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.role !== "hr" || currentUser.hrVerification?.status !== "approved") {
      navigate("/dashboard");
      return;
    }
    fetchStudents();
  }, [filters]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await newRequest.get(`/hr/search-students?${query}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="hr-search">
      <div className="container">
        <header className="search-header">
          <div className="title-box">
            <h1><Briefcase size={32} color="#3b82f6" /> Talent <span>Discovery</span></h1>
            <p>Find university-verified, high-performing candidates for your team.</p>
          </div>
          
          <div className="search-bar-wrapper">
            <div className="search-input">
              <Search size={20} color="#94a3b8" />
              <input 
                name="skill" 
                placeholder="Search by skills (e.g. React, Python, UI Design)" 
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="filter-group">
              <div className="filter-select">
                <Building2 size={18} color="#94a3b8" />
                <input 
                  name="university" 
                  placeholder="University" 
                  onChange={handleFilterChange}
                />
              </div>
              
              <div className="filter-select">
                <Star size={18} color="#94a3b8" />
                <select name="minAts" onChange={handleFilterChange}>
                  <option value="">Min ATS Score</option>
                  <option value="90">90+</option>
                  <option value="80">80+</option>
                  <option value="70">70+</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">Searching verified talent...</div>
        ) : (
          <div className="talent-grid">
            {students.length === 0 ? (
              <div className="no-results">No matching candidates found.</div>
            ) : (
              students.map(student => (
                <div key={student._id} className="talent-card card">
                  <div className="card-top">
                    <div className="avatar">
                      {student.img ? <img src={student.img} alt="" /> : <User size={40} color="#94a3b8" />}
                      {(student.trustBadge === "pro" || student.trustBadge === "expert") && <div className="pro-badge" title="Verified Talent"><Star size={12} fill="white" /></div>}
                      {student.isRecommended && <div className="endorsed-badge-mini" title="University Endorsed"><Star size={12} fill="white" /></div>}
                    </div>
                    <div className="ats-mini">
                      <span className="score">{student.resumeData?.atsScore || 0}</span>
                      <span className="lbl">ATS</span>
                    </div>
                  </div>

                  <div className="card-mid">
                    <h3>{student.username}</h3>
                    <p className="uni"><GraduationCap size={14} /> {student.university || "University Verified"}</p>
                    <div className="skills-wrap">
                      {student.resumeData?.parsedSkills?.slice(0, 3).map((skill, i) => (
                        <span key={i} className="skill-mini">{skill}</span>
                      ))}
                      {student.resumeData?.parsedSkills?.length > 3 && <span className="more">+{student.resumeData.parsedSkills.length - 3}</span>}
                    </div>
                  </div>

                  <div className="card-bottom">
                    <button className="view-profile" onClick={() => navigate(`/candidate/${student._id}`)}>
                      <FileText size={16} /> View Profile
                    </button>
                    <button className="contact-po" onClick={() => navigate(`/po/contact?university=${student.university}`)}>
                      <Building2 size={16} /> Contact PO
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HRSearch;
