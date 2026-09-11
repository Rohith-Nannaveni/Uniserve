import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Briefcase, Rocket } from "lucide-react";
import "./BusinessPortal.css";

const BusinessPortal = () => {
  const navigate = useNavigate();
  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("currentUser");
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      return null;
    }
  })();

  return (
    <div className="business-portal">
      <div className="container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1>The Ultimate Ecosystem for <span>Institutional Hiring & Placements.</span></h1>
            <p>
              Empowering students with verified on-campus drives and global off-campus opportunities, 
              while providing recruiters with a high-trust, institutional-verified talent pool.
            </p>
            <div className="hero-btns">
              <button 
                className="action-btn emerald" 
                onClick={() => navigate(currentUser ? "/subscription" : "/register")}
              >
                Get Started
              </button>
            </div>
          </div>
          <div className="hero-image">
            <img src="/images/business-hero.png" alt="UniServe Business Connection" />
          </div>
        </section>

        {/* Verified Talent Showcase */}
        <section className="showcase-section">
          {/* Candidate Hub */}
          <div className="showcase-item candidate-hub">
            <div className="showcase-content">
              <span className="badge-text">For Candidates</span>
              <h2>Your Global <span>Career Launchpad</span></h2>
              <p>Accelerate your career with institutional endorsement and professional governance.</p>
              <ul className="feature-list">
                <li>
                  <div className="icon-box"><Rocket size={20} /></div>
                  <div>
                    <strong>Unified Job Board:</strong>
                    <span>Access official on-campus university drives and verified off-campus global opportunities in one dashboard.</span>
                  </div>
                </li>
                <li>
                  <div className="icon-box"><CheckCircle size={20} /></div>
                  <div>
                    <strong>Resume AI & Optimization:</strong>
                    <span>Use advanced ATS-analysis and gap identification to build high-impact, university-verified resumes.</span>
                  </div>
                </li>
                <li>
                  <div className="icon-box"><CheckCircle size={20} /></div>
                  <div>
                    <strong>Direct HR Networking:</strong>
                    <span>Discover and directly contact verified recruiters through the "HR Search Spotlight" to fast-track your applications.</span>
                  </div>
                </li>
              </ul>
              <button 
                className="action-btn emerald" 
                onClick={() => navigate(currentUser ? "/subscription" : "/register")}
              >
                Enter Placement Track
              </button>
            </div>
            <div className="showcase-image">
              <img src="/images/candidate-verify.png" alt="Candidate Verification" />
            </div>
          </div>

          {/* Recruiter Hub */}
          <div className="showcase-item recruiter-hub reverse">
            <div className="showcase-content">
              <span className="badge-text navy">For Recruiters</span>
              <h2>Talent <span>Intelligence</span></h2>
              <p>Access the top 10% of university talent through a secure, moderated ecosystem.</p>
              <ul className="feature-list">
                <li>
                  <div className="icon-box navy"><Briefcase size={20} /></div>
                  <div>
                    <strong>Top 10% Pool:</strong>
                    <span>Exclusive access to students who have passed the triple-lock verification.</span>
                  </div>
                </li>
                <li>
                  <div className="icon-box navy"><CheckCircle size={20} /></div>
                  <div>
                    <strong>Institutional Collaboration:</strong>
                    <span>Direct bridge to University Placement Officers for seamless campus drives.</span>
                  </div>
                </li>
                <li>
                  <div className="icon-box navy"><CheckCircle size={20} /></div>
                  <div>
                    <strong>Anti-Ghosting Protection:</strong>
                    <span>Platform-enforced professional conduct through the PO-HR-Admin triad.</span>
                  </div>
                </li>
              </ul>
              <button 
                className="action-btn navy" 
                onClick={() => navigate("/register")}
              >
                Find Top Talent
              </button>
            </div>
            <div className="showcase-image">
              <img src="/images/recruiter-talent.png" alt="Recruiter Intelligence" />
            </div>
          </div>
        </section>

        {/* PO / Career Development Center Section */}
        <section className="po-cdc-section glass-dark">
          <div className="po-cdc-content">
            <span className="badge-text">For Universities</span>
            <h2>Institutional <span>Career Development Center</span></h2>
            <p>
              Empower your placement cell with a centralized hub to manage the entire student 
              career lifecycle—seamlessly integrating on-campus drives with verified off-campus opportunities.
            </p>
            <ul className="feature-list po-features">
              <li>
                <div className="icon-box"><Briefcase size={20} /></div>
                <div>
                  <strong>Unified Drive Management:</strong>
                  <span>Digitally manage campus recruitment cycles and broadcast verified off-campus job links to your students.</span>
                </div>
              </li>
              <li>
                <div className="icon-box"><CheckCircle size={20} /></div>
                <div>
                  <strong>Institutional Verification (KYC):</strong>
                  <span>Official oversight to authenticate student IDs, academic transcripts, and branch updates (e.g., ECE to AI/ML).</span>
                </div>
              </li>
              <li>
                <div className="icon-box"><Rocket size={20} /></div>
                <div>
                  <strong>12-Module Command Center:</strong>
                  <span>Access real-time analytics for Placement Rates, Average CTC Packages, and Student Readiness scores.</span>
                </div>
              </li>
            </ul>
            <button 
                className="po-register-btn"
                onClick={() => navigate("/register")}
            >
                Register your University
            </button>
          </div>
          <div className="po-cdc-image">
            <img src="/images/po-mission-control.png" alt="Institutional Career Development Center" />
          </div>
        </section>

        {/* Institutional Governance Section */}
        <section className="governance-section glass-card">
          <div className="governance-image">
            <img src="/images/governance-shield.png" alt="Institutional Governance Shield" />
          </div>
          <div className="governance-content">
            <span className="badge-text navy">Platform Trust</span>
            <h2>Institutional <span>Governance</span></h2>
            <p>A secure ecosystem built on accountability and professional standards.</p>
            <div className="governance-grid">
              <div className="gov-card">
                <h3>3-Way Arbitration</h3>
                <p>Transparent dispute resolution involving Admins, POs, and HRs to ensure platform integrity.</p>
              </div>
              <div className="gov-card">
                <h3>Anti-Ghosting</h3>
                <p>Strict behavioral monitoring and reporting systems to prevent professional ghosting.</p>
              </div>
              <div className="gov-card">
                <h3>Reliability Badging</h3>
                <p>Trust scores based on institutional verification and past engagement history.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription Comparison Section */}
        <section className="pricing-section">
          <div className="section-header">
            <span className="badge-text">Plans & Pricing</span>
            <h2>Choose the right <span>Tier for Success</span></h2>
          </div>
          <div className="pricing-table-container">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Features</th>
                  <th>Standard (₹0)</th>
                  <th>Premium (₹499)</th>
                  <th className="highlight">Business (₹999)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Marketplace Access</td>
                  <td><CheckCircle size={18} color="#10b981" /></td>
                  <td><CheckCircle size={18} color="#10b981" /></td>
                  <td className="highlight"><CheckCircle size={18} color="#10b981" /></td>
                </tr>
                <tr>
                  <td>Resume AI & ATS Analysis</td>
                  <td>—</td>
                  <td><CheckCircle size={18} color="#10b981" /></td>
                  <td className="highlight"><CheckCircle size={18} color="#10b981" /></td>
                </tr>
                <tr>
                  <td>College Verified Badge</td>
                  <td>—</td>
                  <td><CheckCircle size={18} color="#10b981" /></td>
                  <td className="highlight"><CheckCircle size={18} color="#10b981" /></td>
                </tr>
                <tr>
                  <td>Placement Support & Hiring</td>
                  <td>—</td>
                  <td>—</td>
                  <td className="highlight"><CheckCircle size={18} color="#10b981" /></td>
                </tr>
                <tr>
                  <td>Direct Corporate Visibility</td>
                  <td>—</td>
                  <td>—</td>
                  <td className="highlight"><CheckCircle size={18} color="#10b981" /></td>
                </tr>
                <tr>
                  <td>HR Search Spotlight</td>
                  <td>—</td>
                  <td>—</td>
                  <td className="highlight"><CheckCircle size={18} color="#10b981" /></td>
                </tr>
                <tr>
                  <td>Verified ID & Transcripts</td>
                  <td>—</td>
                  <td>—</td>
                  <td className="highlight"><CheckCircle size={18} color="#10b981" /></td>
                </tr>
                <tr>
                  <td>Order Discounts</td>
                  <td>—</td>
                  <td>10% Off</td>
                  <td className="highlight">20% Off</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Final Onboarding CTA */}
        <section className="onboarding-cta glass-dark">
          <h2>Ready to transform your <span>Institutional Hiring?</span></h2>
          <p>Join hundreds of universities and corporate partners already using UniServe.</p>
          <div className="cta-group">
            <button className="action-btn emerald" onClick={() => navigate("/register")}>Register University</button>
            <button className="action-btn secondary" onClick={() => navigate("/register")}>Partner as Recruiter</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BusinessPortal;
