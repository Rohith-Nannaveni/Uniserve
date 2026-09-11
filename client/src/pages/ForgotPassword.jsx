import React, { useState } from "react";
import "./Login.css";
import newRequest from "../utils/newRequest";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await newRequest.post("/auth/forgot-password", { email });
      setMsg("Reset OTP has been sent to your email!");
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <form onSubmit={handleSubmit}>
        <h1>Forgot Password</h1>
        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px", textAlign: "center" }}>
          Enter your email address and we'll send you a 6-digit code to reset your password.
        </p>
        <label>Email Address</label>
        <input
          type="email"
          placeholder="email@university.edu"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Code"}
        </button>
        {error && <div className="error">{error}</div>}
        {msg && <div className="success" style={{ color: "#10b981", textAlign: "center", marginTop: "10px" }}>{msg}</div>}
      </form>
    </div>
  );
}

export default ForgotPassword;
