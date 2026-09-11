import React from "react";
import "./BusinessTalent.css";
import { useNavigate } from "react-router-dom";
import { UserCheck, ShieldCheck, Briefcase, GraduationCap, Building2, Zap } from "lucide-react";

function BusinessTalent() {
  const navigate = useNavigate();

  return (
    <div className="business-talent">
      <header className="bt-hero">
        <div className="container">
          <h1>UniServe <span>Business & Talent</span></h1>
          <p>The bridge between university talent and corporate recruitment.</p>
        </div>
      </header>

      <div className="bt-sections">
        {/* Section for Students */}
        <section className="bt-student">
          <div className="bt-content">
            <div className="bt-icon-box">
              <GraduationCap size={40} color="#1dbf73" />
            </div>
            <h2>For Students & Freelancers</h2>
            <p>Ready to jumpstart your career? Get noticed by top companies with our verified talent portal.</p>
            
            <ul className="bt-features">
              <li><Zap size={18} /> AI-Powered Resume Optimization</li>
              <li><ShieldCheck size={18} /> Verified University Badging</li>
              <li><Briefcase size={18} /> Direct Placement Opportunities</li>
              <li><UserCheck size={18} /> Exclusive "Placement-Ready" Profile</li>
            </ul>

            <button className="bt-btn-student" onClick={() => navigate("/subscription")}>
              Upgrade to Business Tier
            </button>
          </div>
          <div className="bt-img">
            <img src="/images/student-hero.png" alt="Student Career" />
          </div>
        </section>

        {/* Section for Companies/HRs */}
        <section className="bt-hr inverted">
          <div className="bt-img">
            <img src="/images/hr-hero.png" alt="HR Hiring" />
          </div>
          <div className="bt-content">
            <div className="bt-icon-box">
              <Building2 size={40} color="#3b82f6" />
            </div>
            <h2>For Companies & Recruiters</h2>
            <p>Hire verified talent directly from top universities. No more guesswork, just quality candidates.</p>
            
            <ul className="bt-features">
              <li><Zap size={18} /> Search Students by ATS Score & Skills</li>
              <li><ShieldCheck size={18} /> Access Verified Transcripts & IDs</li>
              <li><Briefcase size={18} /> Propose Campus Drives to Placement Officers</li>
              <li><UserCheck size={18} /> Unified Recruitment Dashboard</li>
            </ul>

            <button className="bt-btn-hr" onClick={() => navigate("/register")}>
              Register as HR / Recruiter
            </button>
          </div>
        </section>
      </div>

      <div className="bt-cta">
        <div className="container">
          <h2>Empowering the next generation of professionals</h2>
          <p>Join thousands of students and companies collaborating on UniServe.</p>
        </div>
      </div>
    </div>
  );
}

export default BusinessTalent;
