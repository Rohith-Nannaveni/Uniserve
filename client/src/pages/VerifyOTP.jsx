import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import newRequest from "../utils/newRequest";
import "./Login.css"; // Reuse login styles

function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  if (!email) {
    navigate("/register");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await newRequest.post("/auth/verify-otp", { email, otp });
      alert("Verification successful! You can now log in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      await newRequest.post("/auth/resend-otp", { email });
      alert("A new OTP has been sent to your email.");
    } catch (err) {
      alert("Failed to resend OTP. Please try again later.");
    }
  };

  return (
    <div className="login">
      <form onSubmit={handleSubmit}>
        <h1>Verify Your Account</h1>
        <p style={{ color: "#74767e", marginBottom: "20px", textAlign: "center" }}>
          We've sent a 6-digit code to <b>{email}</b>
        </p>
        <label>Enter OTP</label>
        <input
          type="text"
          placeholder="123456"
          maxLength="6"
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
        {error && <div className="error">{error}</div>}
        
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <span 
            onClick={resendOTP} 
            style={{ color: "#1dbf73", cursor: "pointer", fontWeight: "600" }}
          >
            Resend Code
          </span>
        </div>
      </form>
    </div>
  );
}

export default VerifyOTP;
