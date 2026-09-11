import React, { useState } from "react";
import "./Login.css";
import newRequest from "../utils/newRequest";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  React.useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const [googleData, setGoogleData] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await newRequest.post("/auth/google", {
        idToken: credentialResponse.credential,
      });
      
      if (res.data.isFirstTime) {
        setGoogleData(res.data);
        // Pre-fill with a suggestion based on name
        const suggestion = res.data.name.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random() * 100);
        setNewUsername(suggestion);
        // Check availability for the suggestion
        const checkRes = await newRequest.get(`/auth/check-username/${suggestion}`);
        setUsernameAvailable(!checkRes.data.exists);
      } else {
        localStorage.setItem("currentUser", JSON.stringify(res.data));
        if (res.data.isAdmin || res.data.role === "hr" || res.data.role === "po") navigate("/dashboard");
        else navigate("/");
      }
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : "Google sign-in failed!");
    }
  };

  const handleCheckUsername = async (val) => {
    setNewUsername(val);
    if (val.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    try {
      const res = await newRequest.get(`/auth/check-username/${val}`);
      setUsernameAvailable(!res.data.exists);
    } catch (err) {
      console.log(err);
    }
  };

  const handleCompleteGoogle = async (e) => {
    e.preventDefault();
    if (!usernameAvailable) return;
    try {
      const res = await newRequest.post("/auth/google-complete", {
        ...googleData,
        username: newUsername,
      });
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      if (res.data.isAdmin || res.data.role === "hr" || res.data.role === "po") navigate("/dashboard");
      else navigate("/");
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : "Failed to complete registration!");
    }
  };

  if (googleData) {
    return (
      <div className="login">
        <form onSubmit={handleCompleteGoogle}>
          <h1>Choose a Username</h1>
          <p style={{ color: "#74767e", marginBottom: "20px", textAlign: "center", fontSize: "14px" }}>
            Welcome! Please choose a unique username for your UniServe account.
          </p>
          <label>Username</label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => handleCheckUsername(e.target.value)}
            placeholder="Choose your username"
            required
          />
          <div style={{ height: "20px", marginTop: "-10px", marginBottom: "10px" }}>
            {usernameAvailable === false && (
              <span style={{ color: "#ef4444", fontSize: "12px" }}>
                Username is already taken!
              </span>
            )}
            {usernameAvailable === true && (
              <span style={{ color: "#10b981", fontSize: "12px" }}>
                Username is available!
              </span>
            )}
          </div>
          <button type="submit" disabled={!usernameAvailable}>
            Complete Registration
          </button>
        </form>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await newRequest.post("/auth/login", {
        username,
        password,
      });
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      if (res.data.isAdmin || res.data.role === "hr" || res.data.role === "po") navigate("/dashboard");
      else navigate("/");
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : "Something went wrong!");
      localStorage.removeItem("currentUser");
    }
  };

  return (
    <div className="login">
        <form onSubmit={handleSubmit}>
          <h1>Sign in</h1>
          <label htmlFor="">Username</label>
          <input
            name="username"
            type="text"
            placeholder="johndoe"
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="">Password</label>
          <input
            name="password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <div style={{ textAlign: "right", marginTop: "-10px", marginBottom: "15px" }}>
            <span 
              onClick={() => navigate("/forgot-password")} 
              style={{ color: "#10b981", fontSize: "14px", cursor: "pointer", fontWeight: "500" }}
            >
              Forgot Password?
            </span>
          </div>
          <button type="submit">Login</button>
          
          <div className="google-login-container" style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#74767e", fontSize: "14px" }}>OR</span>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError("Google sign-in failed!");
              }}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          {error && (
            <div className="error-container" style={{ textAlign: "center" }}>
              <div className="error">{error}</div>
              {error.includes("banned") && (
                <button 
                  type="button" 
                  className="appeal-btn"
                  style={{ 
                    marginTop: "10px", 
                    background: "none", 
                    border: "1px solid #ef4444", 
                    color: "#ef4444",
                    padding: "5px 15px",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                  onClick={() => navigate("/appeal")}
                >
                  Appeal Ban
                </button>
              )}
            </div>
          )}
        </form>
      </div>
  );
}

export default Login;
