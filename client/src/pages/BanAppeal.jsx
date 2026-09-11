import React, { useState } from "react";
import "./BanAppeal.css";
import newRequest from "../utils/newRequest";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Send, Upload } from "lucide-react";
import upload from "../utils/upload";

function BanAppeal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let fileUrls = [];
      if (files.length > 0) {
        fileUrls = await Promise.all(
          Array.from(files).map((file) => upload(file))
        );
      }

      await newRequest.post("/users/appeal", {
        email,
        password,
        reason,
        documents: fileUrls,
      });
      setSuccess("Your appeal has been submitted successfully!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ban-appeal">
      <div className="container">
        <div className="appeal-card">
          <div className="header">
            <AlertCircle size={48} color="#ef4444" />
            <h1>Account Ban Appeal</h1>
            <p>If you believe your account was restricted by mistake, please provide details below.</p>
          </div>

          {success ? (
            <div className="success-msg">
              <h3>Submission Successful</h3>
              <p>{success}</p>
              <button onClick={() => navigate("/login")}>Back to Login</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="item">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="Enter your account email" 
                  required 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
              <div className="item">
                <label>Password</label>
                <input 
                  type="password" 
                  placeholder="Password (Not required for Google sign-in accounts)" 
                  onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
              <div className="item">
                <label>Reason for Appeal</label>
                <textarea 
                  placeholder="Explain why your account should be reinstated..." 
                  required 
                  rows="5"
                  onChange={(e) => setReason(e.target.value)}
                ></textarea>
              </div>
              <div className="item">
                <label>Supporting Documents (Optional)</label>
                <div className="file-input">
                  <input 
                    type="file" 
                    multiple 
                    id="documents" 
                    onChange={(e) => setFiles(e.target.files)} 
                  />
                  <label htmlFor="documents" className="file-label">
                    <Upload size={20} />
                    {files.length > 0 ? `${files.length} files selected` : "Upload Proof/Documents"}
                  </label>
                </div>
              </div>

              {error && <div className="error-msg">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? "Submitting..." : (
                  <>
                    <Send size={18} /> Submit Appeal
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default BanAppeal;
