import React, { useEffect, useState } from "react";
import "./Pay.css";
import { useParams, useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";
import { CreditCard, Banknote, QrCode, AlertTriangle } from "lucide-react";

const Pay = () => {
  const { id } = useParams();
  const [service, setService] = useState({});
  const [vendor, setVendor] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [discount, setDiscount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const makeRequest = async () => {
      try {
        const res = await newRequest.get(`/services/single/${id}`);
        setService(res.data);
        const userRes = await newRequest.get(`/users/${res.data.userId}`);
        setVendor(userRes.data);
      } catch (err) {
        console.log(err);
      }
    };
    makeRequest();
  }, [id]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await newRequest.get(`/coupons/validate/${couponCode}?serviceId=${id}`);
      const coupon = res.data;
      setAppliedCoupon(coupon);
      setCouponError("");
      
      let discountAmount = 0;
      if (coupon.isPercentage) {
        discountAmount = (service.price * coupon.discount) / 100;
      } else {
        discountAmount = coupon.discount;
      }
      setDiscount(discountAmount);
    } catch (err) {
      const backendError = err.response?.data?.message || err.response?.data || "Invalid coupon code";
      setCouponError(backendError);
      setAppliedCoupon(null);
      setDiscount(0);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpay = async () => {
    const isLoaded = await loadRazorpay();
    if (!isLoaded) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      // 1. Get Razorpay Key from backend
      const keyRes = await newRequest.get("/auth/config/razorpay");
      const RAZORPAY_KEY = keyRes.data;

      // 2. Create Order on backend
      const res = await newRequest.post(`/orders/create-razorpay-order/${id}`, {
        couponCode: appliedCoupon?.code
      });
      const data = res.data;

      const options = {
        key: RAZORPAY_KEY,
        amount: data.amount,
        currency: data.currency,
        name: "UniServe",
        description: service.title,
        order_id: data.id,
        handler: async (response) => {
          try {
            await newRequest.post("/orders/confirm-payment", response);
            navigate("/orders");
          } catch (err) {
            console.log(err);
            alert("Payment confirmation failed. Check your internet connection.");
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem("currentUser")).username,
        },
        theme: {
          color: "#1dbf73",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.log(err);
      alert("Failed to initiate Razorpay order. Ensure the server is running and Razorpay keys are configured.");
    }
  };

  const handleManualPayment = async (method) => {
    try {
      await newRequest.post(`/orders/create-manual-order/${id}`, { 
        paymentMethod: method,
        couponCode: appliedCoupon?.code
      });
      alert(`Order initiated with ${method} payment. Please coordinate with the provider.`);
      navigate("/orders");
    } catch (err) {
      console.log(err);
      alert("Failed to initiate manual order. Please try again.");
    }
  };

  return (
    <div className="pay">
      <div className="container">
        <div className="pay-header">
          <h1>Select Payment Method</h1>
          <p>Complete your transaction securely via our available payment modes.</p>
        </div>
        
        <div className="summary">
          <img src={service.cover} alt="" />
          <div className="info">
            <h2>{service.title}</h2>
            <div className="price-breakdown">
              <div className="price-item">
                <span>Original Price</span>
                <span>₹{service.price}</span>
              </div>
              {discount > 0 && (
                <div className="price-item discount">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>- ₹{discount}</span>
                </div>
              )}
              <hr />
              <div className="price-tag">
                <span>Total Amount</span>
                <h3>₹{Math.max(0, (service.price || 0) - discount)}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="coupon-section">
          <h3>Apply Coupon</h3>
          <div className="coupon-input">
            <input 
              type="text" 
              placeholder="Enter coupon code" 
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <button onClick={handleApplyCoupon}>Apply</button>
          </div>
          {couponError && <span className="error">{couponError}</span>}
          {appliedCoupon && <span className="success">Coupon applied successfully!</span>}
        </div>

        <div className="payment-options">
          <div 
            className={`option ${paymentMethod === "razorpay" ? "active" : ""}`}
            onClick={() => setPaymentMethod("razorpay")}
          >
            <CreditCard size={32} />
            <div className="option-info">
              <span className="title">Razorpay (UPI/Card)</span>
              <span className="desc">Instant & Secure Payment</span>
            </div>
          </div>
          <div 
            className={`option ${paymentMethod === "cash" ? "active" : ""}`}
            onClick={() => setPaymentMethod("cash")}
          >
            <Banknote size={32} />
            <div className="option-info">
              <span className="title">Pay Cash</span>
              <span className="desc">Handover cash to provider</span>
            </div>
          </div>
          <div 
            className={`option ${paymentMethod === "qr" ? "active" : ""}`}
            onClick={() => setPaymentMethod("qr")}
          >
            <QrCode size={32} />
            <div className="option-info">
              <span className="title">Provider QR Code</span>
              <span className="desc">Scan provider's personal QR</span>
            </div>
          </div>
        </div>

        {paymentMethod === "razorpay" && (
          <div className="test-info">
            <h4>Testing Credentials (Razorpay Test Mode)</h4>
            <ul>
              <li><strong>Card Number:</strong> 4111 1111 1111 1111 (Success Card)</li>
              <li><strong>Expiry/CVV:</strong> Any future date / Any 3 digits</li>
              <li><strong>UPI ID:</strong> success@razorpay</li>
            </ul>
          </div>
        )}

        {paymentMethod === "qr" && vendor.qrCode && (
          <div className="qr-display">
            <p>Scan this QR code to pay {vendor.username}:</p>
            <div className="qr-container">
              <img src={vendor.qrCode} alt="Vendor QR" />
            </div>
            <span className="hint">Make sure to take a screenshot after payment</span>
          </div>
        )}
        {paymentMethod === "qr" && !vendor.qrCode && (
          <div className="qr-display error">
            <p>This provider has not uploaded a QR code yet. Please select another method.</p>
          </div>
        )}

        <div className="pay-actions">
          {vendor.isRestricted ? (
            <div className="restriction-alert">
              <AlertTriangle size={20} />
              <p>This vendor is currently restricted from accepting new orders due to pending disputes. Please check back later.</p>
            </div>
          ) : (
            <button 
              className="pay-button" 
              onClick={() => {
                if (paymentMethod === "razorpay") handleRazorpay();
                else handleManualPayment(paymentMethod);
              }}
              disabled={paymentMethod === "qr" && !vendor.qrCode}
            >
              Proceed to Pay ₹{Math.max(0, (service.price || 0) - discount)}
            </button>
          )}
        </div>
      </div>
    </div>
  );

};

export default Pay;
