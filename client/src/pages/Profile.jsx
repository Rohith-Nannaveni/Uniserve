import React, { useState, useEffect } from "react";
import "./Profile.css";
import axios from "axios";
import newRequest from "../utils/newRequest";
import upload from "../utils/upload";
import { profileDefault } from "../utils/constants";
import { User, MapPin, QrCode as QrIcon, Upload } from "lucide-react";

function Profile() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [user, setUser] = useState({
    ...currentUser,
    phone: currentUser?.phone || "",
    desc: currentUser?.desc || ""
  });
  const [location, setLocation] = useState(currentUser?.location || "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [qrFile, setQrFile] = useState(null);
  const [imgFile, setImgFile] = useState(null);

  const handleLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const addr = res.data.address;
          const detailedAddress = [
            addr.house_number,
            addr.road,
            addr.neighbourhood || addr.suburb,
            addr.city_district || addr.city || addr.town || addr.village,
            addr.county,
            addr.state,
            addr.postcode,
            addr.country
          ].filter(Boolean).join(", ");
          
          setLocation(detailedAddress);
          setLoading(false);
        } catch (err) {
          console.log(err);
          setLoading(false);
        }
      }, (err) => {
        console.log(err);
        setLoading(false);
      });
    } else {
      alert("Geolocation is not supported by this browser.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    
    try {
      let qrUrl = user.qrCode;
      let imgUrl = user.img;

      if (qrFile) {
        qrUrl = await upload(qrFile);
      }
      if (imgFile) {
        imgUrl = await upload(imgFile);
      }

      const res = await newRequest.put(`/users/${currentUser._id}`, {
        ...user,
        location,
        qrCode: qrUrl,
        img: imgUrl
      });
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      setUser(res.data);
      setMsg("Profile updated successfully!");
    } catch (err) {
      console.log(err);
      setMsg("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile">
      <div className="container">
        <div className="profile-header">
          <h1>Profile Details</h1>
          <p>Manage your account settings and profile information</p>
        </div>
        
        <div className="form-container">
          <div className="form-sections">
            <form onSubmit={handleSubmit}>
              <div className="section-title">Personal Information</div>
              <div className="form-grid">
                <div className="item">
                  <label>Username</label>
                  <input type="text" value={user.username} disabled />
                </div>
                <div className="item">
                  <label>Email</label>
                  <input type="text" value={user.email} disabled />
                </div>
                <div className="item">
                  <label>Phone</label>
                  <input
                    type="text"
                    placeholder="+91 XXXXX XXXXX"
                    value={user.phone}
                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="item">
                <label>Description</label>
                <textarea
                  placeholder="Write a brief bio about yourself..."
                  value={user.desc}
                  onChange={(e) => setUser({ ...user, desc: e.target.value })}
                  rows="4"
                />
              </div>

              <div className="section-title">Location & Address</div>
              <div className="item">
                <label>Detailed Address</label>
                <div className="location-input-group">
                  <textarea
                    placeholder="Street, Area, City, State, ZIP, Country..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    rows="3"
                  />
                  <button type="button" className="location-btn" onClick={handleLocation} disabled={loading}>
                    <MapPin size={18} />
                    {loading ? "Locating..." : "Get Precise Location"}
                  </button>
                </div>
              </div>

              {currentUser.isVendor && (
                <>
                  <div className="section-title">Payment Settings</div>
                  <div className="item">
                    <label>Payment QR Code (UPI)</label>
                    <div className="file-input-wrapper">
                      <input type="file" id="qr-upload" hidden onChange={(e) => setQrFile(e.target.files[0])} />
                      <label htmlFor="qr-upload" className="file-upload-label">
                        <QrIcon size={20} />
                        {qrFile ? qrFile.name : "Choose QR Image"}
                      </label>
                    </div>
                    {user.qrCode && (
                      <div className="qr-preview">
                        <img src={user.qrCode} alt="Payment QR" />
                        <span>Active QR Code</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? "Saving Changes..." : "Save Profile Details"}
                </button>
                {msg && <div className={`status-msg ${msg.includes("Error") ? "error" : "success"}`}>{msg}</div>}
              </div>
            </form>

            <div className="sidebar">
              <div className="sidebar-card profile-image-card">
                <div className="image-wrapper">
                  <img 
                    src={imgFile ? URL.createObjectURL(imgFile) : (user.img || profileDefault)} 
                    alt="" 
                    onError={(e) => { e.target.onerror = null; e.target.src = profileDefault; }}
                  />
                  <label htmlFor="img-upload" className="edit-overlay">
                    <Upload size={24} />
                    <span>Change Photo</span>
                  </label>
                  <input type="file" id="img-upload" hidden onChange={(e) => setImgFile(e.target.files[0])} />
                </div>
                <div className="user-meta">
                  <h3>{user.username}</h3>
                  <span className={`badge ${currentUser.isVendor ? "vendor" : "buyer"}`}>
                    {currentUser.isAdmin ? "Administrator" : 
                      currentUser.isVendor ? "Verified Provider" : 
                      (currentUser.subscription === "business" || currentUser.trustBadge === "pro" || currentUser.trustBadge === "expert") ? "Verified Talent" :
                      "Regular Buyer"}
                  </span>
                </div>
              </div>
              
              <div className="sidebar-card info-card">
                <h4>Quick Tips</h4>
                <ul>
                  <li>Keep your location updated for accurate service matching.</li>
                  <li>A detailed description helps buyers trust your services.</li>
                  <li>Providers should upload a clear UPI QR code for fast payments.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
