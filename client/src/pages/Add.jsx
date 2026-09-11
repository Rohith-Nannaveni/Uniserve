import React, { useReducer, useState, useEffect } from "react";
import "./Add.css";
import { serviceReducer, INITIAL_STATE } from "../reducers/serviceReducer";
import { useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";
import upload from "../utils/upload";
import { Search, Image as ImageIcon, Upload, Wand2, X } from "lucide-react";
import axios from "axios";
import { categoryDefaults } from "../utils/constants";

const Add = () => {
  const [singleFile, setSingleFile] = useState(undefined);
  const [files, setFiles] = useState([]);
  const [verificationFiles, setVerificationFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showPendingMsg, setShowPendingMsg] = useState(false);
  
  // Unsplash states
  const [showUnsplashModal, setShowUnsplashModal] = useState(false);
  const [unsplashImages, setUnsplashImages] = useState([]);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [state, dispatch] = useReducer(serviceReducer, INITIAL_STATE);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await newRequest.get("/services/categories");
        // Ensure standard categories are present
        // Define standard categories as value-label pairs
        const standardCats = [
          { value: "graphics", label: "Graphics & Design" },
          { value: "programming", label: "Programming & Tech" },
          { value: "web-design", label: "Web Design" },
          { value: "wordpress", label: "WordPress" },
          { value: "video", label: "Video & Animation" },
          { value: "writing", label: "Writing & Translation" },
          { value: "ai", label: "AI Services" },
          { value: "marketing", label: "Digital Marketing" },
          { value: "music", label: "Music & Audio" },
          { value: "data-science", label: "Data Science" },
          { value: "business", label: "Business Consulting" },
          { value: "lifestyle", label: "Lifestyle" },
          { value: "photography", label: "Photography" }
        ];
        
        // Ensure standard categories are present and merged with any dynamic ones
        const combined = [...standardCats];
        res.data.forEach(dynamicCat => {
          if (!standardCats.find(c => c.value === dynamicCat)) {
            combined.push({ value: dynamicCat, label: dynamicCat.charAt(0).toUpperCase() + dynamicCat.slice(1) });
          }
        });
        setCategories(combined);
      } catch (err) {
        console.log(err);
      }
    };
    fetchCategories();
  }, []);

  const fetchUnsplashImages = async (query) => {
    if (!query) return;
    setSearchingUnsplash(true);
    try {
      const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
      const res = await axios.get(`https://api.unsplash.com/search/photos?page=1&query=${query}&client_id=${accessKey}&orientation=landscape`);
      setUnsplashImages(res.data.results);
    } catch (err) {
      console.log("Unsplash Error:", err);
    } finally {
      setSearchingUnsplash(false);
    }
  };

  const handleSelectUnsplashImage = (url) => {
    dispatch({ type: "ADD_IMAGES", payload: { cover: url, images: state.images || [] } });
    setShowUnsplashModal(false);
  };

  const handleChange = (e) => {
    if (e.target.name === "cat") {
      if (e.target.value === "other") {
        setIsOtherSelected(true);
        // Set default placeholder for "Other" category
        dispatch({ 
          type: "CHANGE_INPUT", 
          payload: { name: "cover", value: categoryDefaults.other } 
        });
      } else {
        setIsOtherSelected(false);
        const selectedValue = e.target.value;
        dispatch({
          type: "CHANGE_INPUT",
          payload: { name: "cat", value: selectedValue },
        });
        // Auto-set default hero image
        if (categoryDefaults[selectedValue]) {
          dispatch({ 
            type: "ADD_IMAGES", 
            payload: { cover: categoryDefaults[selectedValue], images: state.images || [] } 
          });
        }
      }
    } else {
      dispatch({
        type: "CHANGE_INPUT",
        payload: { name: e.target.name, value: e.target.value },
      });
    }
  };

  const handleFeature = (e) => {
    e.preventDefault();
    const feature = e.target[0].value;
    if (feature.trim() === "") return;
    dispatch({
      type: "ADD_FEATURE",
      payload: feature,
    });
    e.target[0].value = "";
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      let cover = state.cover;
      if (singleFile) {
        cover = await upload(singleFile);
      }

      const images = files.length > 0 
        ? await Promise.all([...files].map(async (file) => await upload(file)))
        : state.images;

      const verificationDocs = verificationFiles.length > 0
        ? await Promise.all([...verificationFiles].map(async (file) => await upload(file)))
        : state.verificationDocs;

      setUploading(false);
      dispatch({ type: "ADD_IMAGES", payload: { cover, images } });
      dispatch({ type: "ADD_VERIFICATION_DOCS", payload: verificationDocs });
      
      if (verificationFiles.length > 0) {
        alert("Verification documents uploaded successfully!");
      }
    } catch (err) {
      console.log(err);
      setUploading(false);
      alert("Upload failed. Please try again.");
    }
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser.isRestricted) {
      alert(`Access Restricted: ${currentUser.restrictionReason}. You cannot add new services until pending refunds are cleared.`);
      return;
    }

    const finalCat = isOtherSelected ? customCategory : state.cat;
    
    if (!finalCat) {
        alert("Please select or enter a category");
        return;
    }

    // Strict Numeric Validation
    const delivery = Number(state.deliveryTime);
    const revisions = Number(state.revisionNumber);
    const price = Number(state.price);

    if (isNaN(delivery) || delivery <= 0) {
      alert("Please enter a valid number for delivery days (minimum 1).");
      return;
    }
    if (isNaN(revisions) || revisions < 0) {
      alert("Please enter a valid number for revisions (minimum 0).");
      return;
    }
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid price (minimum 1).");
      return;
    }
    if (!state.title || !state.desc || !state.shortTitle || !state.shortDesc || !state.cover) {
      alert("Please fill in all required fields (Title, Description, Short Title, Short Description, and Cover Image).");
      return;
    }

    const savedState = {
      ...state,
      cat: finalCat,
      deliveryTime: delivery,
      revisionNumber: revisions,
      price: price,
    };

    try {
      // If user is not yet a vendor, upgrade them automatically on first service creation
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser.isVendor) {
        const updateRes = await newRequest.put(`/users/${currentUser._id}`, {
          isVendor: true
        });
        localStorage.setItem("currentUser", JSON.stringify(updateRes.data));
        // Refresh page or update context if needed, but here we just continue with creation
      }

      await newRequest.post("/services", savedState);
      setShowPendingMsg(true);
      setTimeout(() => {
        navigate("/my-services");
      }, 3000);
    } catch (err) {
      console.log(err);
      alert(err.response?.data || "Something went wrong while creating the service!");
    }
  };

  return (
    <div className="add">
        <div className="container">
          <h1>Create New Service</h1>
          <div className="sections">
            <div className="card info">
              <div className="form-group">
                <label>Service Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. I will design your brand logo"
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="cat" id="cat" onChange={handleChange}>
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                  <option value="other">Other (Suggest New)</option>
                </select>
              </div>
              
              {isOtherSelected && (
                <div className="form-group custom-category">
                  <label>Enter New Category Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Data Science" 
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                </div>
              )}

              <div className="hero-image-selection">
                <label>Service Hero Image (Cover)</label>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "-5px", marginBottom: "10px" }}>
                  This is the main thumbnail shown on the marketplace. Use a high-quality 16:9 image.
                </p>
                <div className="hero-preview-container">
                  {state.cover ? (
                    <img src={state.cover} alt="Hero Preview" className="hero-preview" />
                  ) : (
                    <div className="hero-placeholder">
                      <ImageIcon size={48} />
                      <span>Select a category to see default or search Unsplash</span>
                    </div>
                  )}
                  <div className="hero-options-overlay">
                    <button className="option-btn" onClick={() => setShowUnsplashModal(true)}>
                      <Search size={16} /> Get from Unsplash
                    </button>
                    <label className="option-btn upload-label">
                      <Upload size={16} /> Upload Custom
                      <input
                        type="file"
                        style={{ display: "none" }}
                        onChange={(e) => setSingleFile(e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
                {singleFile && (
                   <button className="upload-confirm-btn" onClick={handleUpload} disabled={uploading}>
                     {uploading ? "Uploading..." : "Click to confirm upload"}
                   </button>
                )}
              </div>

              <div className="image-upload-section">
                <label>Gallery Images (Optional)</label>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "-5px", marginBottom: "10px" }}>
                  Showcase your portfolio. These images appear in a slider on your service page.
                </p>
                <div className="file-input-wrapper">
                  <div className="form-group">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setFiles(e.target.files)}
                    />
                  </div>
                  <button onClick={handleUpload} disabled={uploading || files.length === 0}>
                    {uploading ? "Uploading..." : "Upload Gallery"}
                  </button>
                </div>
                {state.images?.length > 0 && <p className="upload-status">✓ {state.images.length} gallery images ready</p>}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="desc"
                  placeholder="Explain your service in detail..."
                  rows="10"
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="verification-upload-section">
                <label style={{ color: "#e11d48", fontWeight: "bold" }}>Verification Documents (Recommended)</label>
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "-5px", marginBottom: "10px" }}>
                  Upload skill certificates, portfolio links (as PDF), or identity documents to help Admin verify your expertise faster. (Optional)
                </p>
                <div className="file-input-wrapper">
                  <div className="form-group">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setVerificationFiles(e.target.files)}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleUpload} 
                    className="verify-upload-btn"
                    disabled={uploading || verificationFiles.length === 0}
                    style={{ backgroundColor: "#e11d48", color: "white" }}
                  >
                    {uploading ? "Uploading..." : "Upload Verification Docs"}
                  </button>
                </div>
                {state.verificationDocs?.length > 0 && (
                  <p className="upload-status" style={{ color: "#059669" }}>
                    ✓ {state.verificationDocs.length} verification documents uploaded
                  </p>
                )}
              </div>
            </div>

            <div className="card details">
              <div className="form-group">
                <label>Short Title</label>
                <input
                  type="text"
                  name="shortTitle"
                  placeholder="e.g. Professional Minimalist Logo"
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Short Description</label>
                <textarea
                  name="shortDesc"
                  onChange={handleChange}
                  placeholder="Brief summary of what's included"
                  rows="4"
                ></textarea>
              </div>
              <div className="sections" style={{gridTemplateColumns: "1fr 1fr", gap: "20px"}}>
                <div className="form-group">
                  <label>Delivery (Days)</label>
                  <input type="number" name="deliveryTime" min="1" onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Revisions</label>
                  <input
                    type="number"
                    name="revisionNumber"
                    min="0"
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="features-section">
                <label>Service Features</label>
                <form className="feature-form" onSubmit={handleFeature}>
                  <input type="text" placeholder="e.g. Source file included" />
                  <button type="submit">Add</button>
                </form>
                <div className="addedFeatures">
                  {state?.features?.map((f) => (
                    <div className="feature-tag" key={f}>
                      {f}
                      <span onClick={() => dispatch({ type: "REMOVE_FEATURE", payload: f })}>
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Price (₹)</label>
                <input type="number" min="1" onChange={handleChange} name="price" />
              </div>
            </div>

            <button className="submit-button" onClick={handleSubmit} disabled={uploading}>
              Create Service
            </button>
          </div>
          {showPendingMsg && (
            <div className="pending-message">
              <h3>Success!</h3>
              <p>Your service has been submitted for Admin verification. It will be visible on the marketplace once approved.</p>
            </div>
          )}

          {showUnsplashModal && (
            <div className="unsplash-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>Search Unsplash for Service Hero</h2>
                  <button className="close-btn" onClick={() => setShowUnsplashModal(false)}>
                    <X size={24} />
                  </button>
                </div>
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search high-res images (e.g. web developer, writing)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && fetchUnsplashImages(searchQuery)}
                  />
                  <button onClick={() => fetchUnsplashImages(searchQuery)} disabled={searchingUnsplash}>
                    {searchingUnsplash ? "Searching..." : <Search size={20} />}
                  </button>
                </div>
                <div className="image-grid">
                  {unsplashImages.length > 0 ? (
                    unsplashImages.map((img) => (
                      <div
                        key={img.id}
                        className="unsplash-card"
                        onClick={() => handleSelectUnsplashImage(img.urls.regular)}
                      >
                        <img src={img.urls.small} alt={img.alt_description} />
                        <div className="credit">by {img.user.name}</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">
                      {searchingUnsplash ? "Finding the best matches..." : "Start searching for high-quality visuals"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default Add;
