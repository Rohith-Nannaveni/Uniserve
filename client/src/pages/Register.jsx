import React, { useState } from "react";
import "./Register.css";
import { useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";
import { GoogleLogin } from '@react-oauth/google';

function Register() {
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    country: "",
    isVendor: false,
    role: "student",
    desc: "",
    companyName: "",
    workEmail: "",
    department: "",
    university: "",
    proof: "",
    authorityLetter: "",
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  const [googleData, setGoogleData] = useState(null);
  const [newUsername, setNewUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await newRequest.post("/auth/google", {
        idToken: credentialResponse.credential,
      });
      
      if (res.data.isFirstTime) {
        setGoogleData(res.data);
        const suggestion = res.data.name.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random() * 100);
        setNewUsername(suggestion);
        const checkRes = await newRequest.get(`/auth/check-username/${suggestion}`);
        setUsernameAvailable(!checkRes.data.exists);
      } else {
        localStorage.setItem("currentUser", JSON.stringify(res.data));
        if (res.data.isAdmin || res.data.role === "hr" || res.data.role === "po") navigate("/dashboard");
        else navigate("/");
      }
    } catch (err) {
      setError(typeof err.response?.data === 'string' ? err.response.data : "Google sign-up failed!");
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

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  React.useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleUpload = async (file, field) => {
    setUploading(true);
    try {
      const { default: upload } = await import("../utils/upload");
      const url = await upload(file);
      setUser((prev) => ({ ...prev, [field]: url }));
    } catch (err) {
      console.log(err);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    setUser((prev) => {
      return { ...prev, [e.target.name]: e.target.value };
    });
  };

  const handleRoleChange = (e) => {
    setUser((prev) => ({ ...prev, role: e.target.value, isVendor: false }));
  };

  const handleSeller = (e) => {
    setUser((prev) => {
      return { ...prev, isVendor: e.target.checked };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await newRequest.post("/auth/register", user);
      navigate("/verify-otp", { state: { email: user.email } });
    } catch (err) {
      setError(err.response?.data || "Registration failed!");
    }
  };

  if (googleData) {
    return (
      <div className="register">
        <form onSubmit={handleCompleteGoogle} style={{ flexDirection: "column", maxWidth: "500px", gap: "20px" }}>
          <div className="google-complete-container" style={{ display: "flex", flexDirection: "column", gap: "15px", width: "100%" }}>
            <h1>Choose a Username</h1>
            <p style={{ color: "#74767e", marginBottom: "10px", fontSize: "14px", lineHeight: "1.5" }}>
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
            <div style={{ height: "20px" }}>
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
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="register">
      <form onSubmit={handleSubmit}>
        <div className="left">
          <h1>Create a new account</h1>
          <label>I am registering as:</label>
          <select name="role" onChange={handleRoleChange} value={user.role} className="role-selector">
            <option value="student">Student / Freelancer</option>
            <option value="hr">Company / HR</option>
            <option value="po">Placement Officer</option>
          </select>

          <label htmlFor="">Username</label>
          <input
            name="username"
            type="text"
            placeholder="johndoe"
            onChange={handleChange}
            required
          />
          <label htmlFor="">Email</label>
          <input
            name="email"
            type="email"
            placeholder="email"
            onChange={handleChange}
            required
          />
          <label htmlFor="">Password</label>
          <input name="password" type="password" onChange={handleChange} required />
          <label htmlFor="">Country</label>
          <input
            name="country"
            type="text"
            placeholder="India"
            onChange={handleChange}
            required
          />

          {user.role === "student" && (
            <>
              <h1>I want to become a seller</h1>
              <div className="toggle">
                <label htmlFor="">Activate the seller account</label>
                <label className="switch">
                  <input type="checkbox" onChange={handleSeller} />
                  <span className="slider round"></span>
                </label>
              </div>
            </>
          )}

          <button type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Register"}
          </button>
          
          <div className="google-signup-container" style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "#74767e", fontSize: "14px" }}>OR</span>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                setError("Google sign-up failed!");
              }}
              useOneTap
              theme="outline"
              size="large"
              width="100%"
            />
          </div>
          
          {error && <div className="error" style={{ color: "red", marginTop: "10px" }}>{error}</div>}
        </div>

        <div className="right">
          {user.role === "student" && (
            <>
              <h1>Student Details</h1>
              <label htmlFor="">Phone Number</label>
              <input
                name="phone"
                type="text"
                placeholder="+91 9876543210"
                onChange={handleChange}
              />
              <label htmlFor="">Description</label>
              <textarea
                placeholder="A short description of yourself"
                name="desc"
                cols="30"
                rows="10"
                onChange={handleChange}
              ></textarea>
            </>
          )}

          {user.role === "hr" && (
            <>
              <h1>Company Verification</h1>
              <label>Company Name</label>
              <input name="companyName" placeholder="TechCorp Inc." onChange={handleChange} required />
              <label>Work Email</label>
              <input name="workEmail" type="email" placeholder="hr@techcorp.com" onChange={handleChange} required />
              <label>Company Proof (GST/Incorporation)</label>
              <input type="file" onChange={(e) => handleUpload(e.target.files[0], "proof")} required />
              {user.proof && <span className="upload-success">✅ Proof Uploaded</span>}
              <label>Description</label>
              <textarea name="desc" placeholder="Brief about your company hiring needs" onChange={handleChange}></textarea>
            </>
          )}

          {user.role === "po" && (
            <>
              <h1>University Verification</h1>
              <label>University / College Name</label>
              <input name="university" placeholder="VIT-AP University" onChange={handleChange} required />
              <label>Department</label>
              <input name="department" placeholder="Training & Placements" onChange={handleChange} required />
              <label>Official ID Card</label>
              <input type="file" onChange={(e) => handleUpload(e.target.files[0], "proof")} required />
              <label>Letter of Authority / Appointment</label>
              <input type="file" onChange={(e) => handleUpload(e.target.files[0], "authorityLetter")} required />
              {user.proof && user.authorityLetter && <span className="upload-success">✅ All Documents Uploaded</span>}
            </>
          )}
        </div>
      </form>
    </div>
  );
}

export default Register;
