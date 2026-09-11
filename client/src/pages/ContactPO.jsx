import React, { useState, useEffect } from "react";
import "./POOutreach.css";
import newRequest from "../utils/newRequest";
import { useLocation, useNavigate } from "react-router-dom";
import { Building2, User, Mail, Send, CheckCircle, ChevronLeft } from "lucide-react";

function ContactPO() {
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    type: "campus_drive",
    proposedDates: "",
    targetBranches: "",
    expectedBatch: "",
    description: ""
  });

  const { search } = useLocation();
  const universityName = new URLSearchParams(search).get("university");
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  useEffect(() => {
    const fetchPO = async () => {
      if (!universityName) return setLoading(false);
      try {
        const res = await newRequest.get(`/hr/po-contact?university=${universityName}`);
        setPo(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Verified PO not found.");
        navigate(`/po-not-registered?university=${universityName}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPO();
  }, [universityName]);

  const handleMessage = async () => {
    try {
      const res = await newRequest.post("/conversations", { to: po._id });
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      alert("Failed to start conversation.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await newRequest.post("/proposals", {
        ...form,
        hrId: currentUser._id,
        poId: po._id,
        initiatedBy: "hr",
        proposedDates: [new Date(form.proposedDates)],
        targetBranches: form.targetBranches.split(",").map(s => s.trim()),
        expectedBatch: form.expectedBatch.split(",").map(s => s.trim())
      });
      alert("Proposal sent to Placement Office!");
      setShowModal(false);
      navigate("/hr-proposals");
    } catch (err) {
      alert("Failed to send proposal.");
    }
  };

  if (loading) return <div className="po-outreach-loading">Searching for Placement Office...</div>;

  return (
    <div className="po-outreach">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)} style={{background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"5px", color:"#64748b", marginBottom:"20px"}}>
          <ChevronLeft size={20} /> Back
        </button>

        {!po ? (
          <div className="card" style={{textAlign:"center", padding:"60px"}}>
            <Building2 size={60} color="#cbd5e1" style={{marginBottom:"20px"}} />
            <h2>No Verified PO found for {universityName}</h2>
            <p>This university's placement officer hasn't registered or been verified yet.</p>
          </div>
        ) : (
          <div className="po-contact-card card">
            <div className="po-header-box" style={{display:"flex", alignItems:"center", gap:"30px", marginBottom:"30px", paddingBottom:"30px", borderBottom:"1px solid #f1f5f9"}}>
              <div className="po-avatar-big" style={{width:"80px", height:"80px", background:"#f1f5f9", borderRadius:"20px", display:"flex", alignItems:"center", justifyCenter:"center"}}>
                {po.img ? <img src={po.img} alt="" style={{width:"100%", height:"100%", borderRadius:"20px", objectFit:"cover"}} /> : <User size={40} color="#94a3b8" />}
              </div>
              <div className="po-info-main">
                <h1 style={{fontSize:"2rem", color:"#0f172a"}}>{po.university}</h1>
                <p style={{color:"#64748b"}}>Placement Office • {po.poVerification?.department}</p>
                <div className="v-tag" style={{display:"inline-flex", alignItems:"center", gap:"6px", background:"#dcfce7", color:"#166534", padding:"4px 12px", borderRadius:"6px", fontSize:"0.75rem", fontWeight:"700", marginTop:"10px"}}>
                  <CheckCircle size={14} /> VERIFIED INSTITUTION
                </div>
              </div>
            </div>

            <div className="po-details-box" style={{display:"flex", gap:"40px", marginBottom:"40px"}}>
              <div className="p-item" style={{display:"flex", alignItems:"center", gap:"10px", color:"#475569"}}>
                <User size={18} color="#3b82f6" />
                <span><strong>Officer:</strong> {po.username}</span>
              </div>
              <div className="p-item" style={{display:"flex", alignItems:"center", gap:"10px", color:"#475569"}}>
                <Mail size={18} color="#3b82f6" />
                <span><strong>Official Email:</strong> {po.email}</span>
              </div>
            </div>

            <div className="po-actions-box">
              {currentUser?.role === "student" ? (
                <button className="submit-btn" style={{width:"auto", padding:"16px 40px", display:"flex", alignItems:"center", gap:"12px"}} onClick={handleMessage}>
                  <Mail size={18} /> Message Placement Office
                </button>
              ) : (
                <button className="submit-btn" style={{width:"auto", padding:"16px 40px", display:"flex", alignItems:"center", gap:"12px"}} onClick={() => setShowModal(true)}>
                  <Send size={18} /> Propose Campus Recruitment
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
             <h2>Recruitment Proposal</h2>
             <p>Sending a formal hiring request to <strong>{po.university}</strong></p>
             <form onSubmit={handleSubmit}>
                <label>Requirement Type</label>
                <select onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="campus_drive">Full-time Campus Drive</option>
                  <option value="internship">Internship Hiring</option>
                  <option value="bulk_hiring">Bulk Recruitment</option>
                  <option value="workshop">Technical Workshop</option>
                </select>

                <label>Preferred Start Date</label>
                <input type="date" required onChange={e => setForm({...form, proposedDates: e.target.value})} />

                <label>Target Departments (Comma separated)</label>
                <input placeholder="CSE, IT, ECE" required onChange={e => setForm({...form, targetBranches: e.target.value})} />

                <label>Target Batches (Comma separated)</label>
                <input placeholder="2024, 2025" required onChange={e => setForm({...form, expectedBatch: e.target.value})} />

                <label>Job Description / Requirements</label>
                <textarea rows="4" placeholder="Mention roles, salary range, and eligibility..." onChange={e => setForm({...form, description: e.target.value})} />

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="submit-btn">Send Recruitment Proposal</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContactPO;
