import React, { useState } from "react";
import "./Login.css";
import newRequest from "../utils/newRequest";
import { useLocation, useNavigate } from "react-router-dom";

function ResetPassword() {
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await newRequest.post("/auth/reset-password", { email, otp, newPassword });
      setMsg("Password has been reset successfully!");
      setTimeout(() => {
        navigate("/login");
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
        <h1>Reset Password</h1>
        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px", textAlign: "center" }}>
          Please enter the 6-digit code sent to your email and your new password.
        </p>
        {!state?.email && (
          <>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="email@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </>
        )}
        <label>Verification Code (OTP)</label>
        <input
          type="text"
          placeholder="6-digit code"
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <label>New Password</label>
        <input
          type="password"
          placeholder="••••••••"
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <label>Confirm Password</label>
        <input
          type="password"
          placeholder="••••••••"
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
        {error && <div className="error">{error}</div>}
        {msg && <div className="success" style={{ color: "#10b981", textAlign: "center", marginTop: "10px" }}>{msg}</div>}
      </form>
    </div>
  );
}

export default ResetPassword;
