import React, { useState, useEffect } from "react";
import "./Subscription.css";
import { Check, ShieldCheck, Zap, Award, X, CreditCard, QrCode, Banknote } from "lucide-react";
import newRequest from "../utils/newRequest";
import { useNavigate } from "react-router-dom";

function Subscription() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [university, setUniversity] = useState("");
  const [manualUniversity, setManualUniversity] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [transcripts, setTranscripts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      return storedUser ? JSON.parse(storedUser) : {};
    } catch (err) {
      return {};
    }
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await newRequest.get("/users/me");
        setUser(res.data);
        localStorage.setItem("currentUser", JSON.stringify(res.data));
      } catch (err) {
        console.log(err);
      }
    };
    const fetchUniversities = async () => {
      try {
        const res = await newRequest.get("/users/universities");
        setUniversities(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchUser();
    fetchUniversities();
  }, []);

  useEffect(() => {
    if (showPaymentModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showPaymentModal]);

  const handleFileUpload = async (file, isTranscript = false) => {
    setUploading(true);
    try {
      const { default: upload } = await import("../utils/upload");
      const url = await upload(file);
      if (isTranscript) {
        setTranscripts((prev) => [...prev, url]);
      } else {
        setCollegeId(url);
      }
    } catch (err) {
      console.log(err);
      alert("File upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handlePlanSelect = async (plan) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
    // Reset fields
    setUniversity("");
    setManualUniversity("");
    setCollegeId("");
    setTranscripts([]);
    const adminPhone = import.meta.env.VITE_ADMIN_PHONE;
    
    if (!adminPhone) {
      throw new Error("CRITICAL: VITE_ADMIN_PHONE is missing from .env");
    }

    // Use the standardized admin payment info directly
    setAdminInfo({
      qrCode: "/images/defaults/payment-qr-default.jpeg",
      phone: adminPhone
    });
  };

  const handlePayment = async () => {
    if (selectedPlan.name !== "normal") {
      if (!university) return alert("Please select a university option");
      if (university === "other" && !manualUniversity.trim()) {
        return alert("Please enter your university name");
      }
      // Documents are now optional
    }

    if (!paymentMethod) return alert("Please select a payment method");
    setLoading(true);

    const finalUniversity = university === "other" ? manualUniversity : university;

    try {
      if (paymentMethod === "razorpay") {
        const keyRes = await newRequest.get("/auth/config/razorpay");
        const RAZORPAY_KEY = keyRes.data;

        const orderRes = await newRequest.post("/users/upgrade", { 
          plan: selectedPlan.name, 
          paymentMethod: "razorpay",
          university: finalUniversity,
          collegeId,
          transcripts
        });
        const order = orderRes.data;

        const loadRazorpay = () => {
          return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const isLoaded = await loadRazorpay();
        if (!isLoaded) return alert("Razorpay SDK failed to load.");

        const options = {
          key: RAZORPAY_KEY,
          amount: order.amount,
          currency: order.currency,
          name: "UniServe Subscription",
          description: `Upgrade to ${selectedPlan.title}`,
          order_id: order.id,
          handler: async (response) => {
            try {
              await newRequest.post("/users/upgrade/verify", {
                ...response,
                university: finalUniversity,
                collegeId,
                transcripts
              });
              const userRes = await newRequest.get("/users/me");
              setUser(userRes.data);
              localStorage.setItem("currentUser", JSON.stringify(userRes.data));
              alert("Payment Successful! Your subscription is now active.");
              navigate("/dashboard");
            } catch (err) {
              alert("Verification failed. Please contact support.");
            }
          },
          prefill: {
            name: user.username,
            email: user.email,
          },
          theme: { color: "#1dbf73" },
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } else {
        // QR or Cash
        await newRequest.post("/users/upgrade", {
          plan: selectedPlan.name,
          paymentMethod,
          university: finalUniversity,
          collegeId,
          transcripts
        });
        alert("Subscription request submitted! Admin will verify and activate your plan shortly.");
        setShowPaymentModal(false);
        navigate("/dashboard");
      }
    } catch (err) {
      console.log(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: "normal",
      title: "Standard",
      price: "₹0",
      features: [
        "Marketplace Access",
        "Community support",
        "Public profile",
        "Basic services listing"
      ],
      icon: <Zap size={32} color="#666" />,
      buttonText: "Included",
      disabled: true
    },
    {
      name: "premium",
      title: "UniServe Premium",
      price: "₹499/mo",
      features: [
        "AI Resume Optimization",
        "ATS Score & Gap Analysis",
        "College Verified Badge",
        "Priority Support",
        "10% discount on all orders"
      ],
      icon: <ShieldCheck size={32} color="#1dbf73" />,
      buttonText: "Upgrade to Premium",
      popular: true
    },
    {
      name: "business",
      title: "Business Tier",
      price: "₹999/mo",
      features: [
        "Everything in Premium",
        "Placement Support & Hiring",
        "Direct Corporate Visibility",
        "HR Search Spotlight",
        "Verified ID & Transcripts",
        "20% discount on all orders"
      ],
      icon: <Award size={32} color="#f1c40f" />,
      buttonText: "Go Business"
    }
  ];

  return (
    <div className="subscription">
      <header className="subscription-header">
        <h1>Choose Your Plan</h1>
        <p>Scale your freelancing business with UniServe's premium tools and benefits.</p>
        
        {user.studentVerification?.status === "rejected" && (
          <div className="rejection-alert">
            <div className="alert-content">
              <h3>Subscription Request Rejected</h3>
              <p>Reason: <strong>{user.studentVerification.rejectionReason || "Please contact admin for details."}</strong></p>
              <p className="hint">You can submit a new request below by selecting a plan again.</p>
            </div>
          </div>
        )}

        {user.studentVerification?.status === "pending" && (
          <div className="pending-alert">
            <div className="alert-content">
              <h3>Verification in Progress</h3>
              <p>Your subscription request is currently being reviewed by our team.</p>
            </div>
          </div>
        )}
      </header>

      <div className="plans-container">
        <div className="plans-grid">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`plan-card ${plan.popular ? 'popular' : ''} ${user.subscription === plan.name ? 'current' : ''}`}
            >
              {plan.popular && <span className="popular-tag">Most Popular</span>}
              {user.subscription === plan.name && <span className="current-tag">Active Plan</span>}
              
              <div className="plan-icon-wrapper">
                {plan.icon}
              </div>
              
              <h2>{plan.title}</h2>
              
              <div className="plan-price-box">
                <span className="plan-price">{plan.price.split('/')[0]}</span>
                {plan.price.includes('/') && <span className="plan-period">/{plan.price.split('/')[1]}</span>}
              </div>

              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <Check className="feature-check" size={18} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePlanSelect(plan)}
                disabled={loading || user.subscription === plan.name || plan.disabled}
                className={`plan-btn ${user.subscription === plan.name ? 'current-btn' : 'upgrade-btn'}`}
              >
                {user.subscription === plan.name ? 'Active' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>

      {showPaymentModal && (
        <div className="sub-modal-overlay">
          <div className="sub-modal-content">
            <button className="close-btn" onClick={() => setShowPaymentModal(false)}>
              <X size={24} />
            </button>
            
            <h2>Subscribe to {selectedPlan?.title}</h2>
            <p className="price-tag">{selectedPlan?.price}</p>

            {selectedPlan?.name !== "normal" && (
              <div className="verification-fields">
                <h3>Verification Details</h3>
                <label>Select University</label>
                <select 
                  value={university} 
                  onChange={(e) => setUniversity(e.target.value)}
                  className="sub-input"
                >
                  <option value="">-- Select University --</option>
                  {universities.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                  <option value="other">My college is not listed</option>
                </select>

                {university === "other" && (
                  <>
                    <label>Enter University Name <span className="required-star">*</span></label>
                    <input 
                      placeholder="Enter University Name" 
                      value={manualUniversity}
                      onChange={(e) => setManualUniversity(e.target.value)}
                      className="sub-input"
                      required
                    />
                  </>
                )}

                <label>College ID Card (Optional)</label>
                <input 
                  type="file" 
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  className="sub-file-input"
                />
                {collegeId && <span className="upload-success">✅ ID Uploaded</span>}

                {selectedPlan?.name === "business" && (
                  <>
                    <label>Transcripts (Up to current sem)</label>
                    <input 
                      type="file" 
                      onChange={(e) => handleFileUpload(e.target.files[0], true)}
                      className="sub-file-input"
                    />
                    <div className="transcript-list">
                      {transcripts.map((t, i) => (
                        <div key={i} className="transcript-item">✅ Transcript {i+1} uploaded</div>
                      ))}
                    </div>
                  </>
                )}
                {uploading && <p className="upload-msg">Uploading files...</p>}
              </div>
            )}

            <div className="payment-options">
              <label className={`pay-option ${paymentMethod === 'razorpay' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="razorpay" 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <CreditCard size={20} />
                <span>Razorpay (Online)</span>
              </label>

              <label className={`pay-option ${paymentMethod === 'qr' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="qr" 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <QrCode size={20} />
                <span>QR Code (UPI)</span>
              </label>

              <label className={`pay-option ${paymentMethod === 'cash' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="payment" 
                  value="cash" 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <Banknote size={20} />
                <span>Pay Offline (Cash)</span>
              </label>
            </div>

            {paymentMethod === "qr" && adminInfo && (
              <div className="qr-section">
                <p>Scan the Admin QR to pay</p>
                <div className="admin-qr-wrapper">
                  <img src={adminInfo.qrCode} alt="Admin QR" className="admin-qr-img" />
                </div>
                <p className="upi-id">UPI: {adminInfo.phone}@ybl</p>
                <p className="payment-hint">After payment, click "Confirm Subscription" below.</p>
              </div>
            )}

            {paymentMethod === "cash" && (
              <div className="cash-section">
                <p>Please visit the Admin office to pay cash.</p>
                <p>Once paid, Admin will activate your subscription.</p>
              </div>
            )}

            <button 
              className="confirm-sub-btn" 
              onClick={handlePayment}
              disabled={loading || !paymentMethod}
            >
              {loading ? "Processing..." : "Confirm Subscription"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscription;
