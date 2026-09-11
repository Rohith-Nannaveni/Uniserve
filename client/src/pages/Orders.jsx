import React, { useEffect, useState } from "react";
import "./Orders.css";
import { useNavigate } from "react-router-dom";
import newRequest from "../utils/newRequest";
import upload from "../utils/upload";
import { MessageSquare, Download, CheckCircle, AlertTriangle, XCircle, Upload, X, Trash2 } from "lucide-react";
import { categoryDefaults, imageDefault } from "../utils/constants";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showRefundDisputeModal, setShowRefundDisputeModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [refundDisputeReason, setRefundDisputeReason] = useState("");
  const [refundDisputeFile, setRefundDisputeFile] = useState(null);
  const [disputeFiles, setDisputeFiles] = useState([]);
  const [refundProofFiles, setRefundProofFiles] = useState({}); // Object to track files per orderId
  const [uploading, setUploading] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await newRequest.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order record from your tracking?")) return;
    try {
      await newRequest.delete(`/orders/${id}`);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data || "Failed to delete order.");
    }
  };

  const handleDownload = async (id) => {
    window.open(`http://localhost:5000/api/orders/download/${id}`, "_blank");
  };

  const handleComplete = async (id) => {
    try {
      await newRequest.patch(`/orders/complete/${id}`);
      fetchOrders();
    } catch (err) {
      console.log(err);
      alert("Error completing order: " + (err.response?.data || err.message));
    }
  };

  const handleMarkRefundSent = async (id) => {
    try {
      let proofUrl = "";
      const selectedFile = refundProofFiles[id];
      
      if (selectedFile) {
        setUploading(true);
        proofUrl = await upload(selectedFile);
      }
      
      await newRequest.patch(`/orders/refund/mark-sent/${id}`, { refundProof: proofUrl });
      alert("Refund marked as sent. Waiting for buyer confirmation.");
      
      // Clear specific file after success
      setRefundProofFiles(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Error marking refund as sent.");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmRefund = async (id) => {
    if (!window.confirm("Confirm that you have received the refund amount?")) return;
    try {
      await newRequest.patch(`/orders/refund/confirm/${id}`);
      alert("Refund confirmed. Case closed.");
      fetchOrders();
    } catch (err) {
      alert("Error confirming refund.");
    }
  };

  const handleRaiseRefundDispute = (id) => {
    setSelectedOrderId(id);
    setShowRefundDisputeModal(true);
  };

  const submitRefundDispute = async () => {
    if (!refundDisputeReason) return alert("Please provide a reason.");
    setUploading(true);
    try {
      let proofUrl = "";
      if (refundDisputeFile) {
        proofUrl = await upload(refundDisputeFile);
      }
      
      await newRequest.patch(`/orders/refund/dispute/${selectedOrderId}`, { 
        reason: refundDisputeReason,
        proof: proofUrl
      });
      
      alert("Refund dispute raised. Admin will review your payment proof.");
      setShowRefundDisputeModal(false);
      setRefundDisputeReason("");
      setRefundDisputeFile(null);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Error raising refund dispute.");
    } finally {
      setUploading(false);
    }
  };

  const submitDispute = async () => {
    if (!disputeReason) return alert("Please provide a reason.");
    setUploading(true);
    try {
      const proofs = await Promise.all(
        [...disputeFiles].map(async (file) => await upload(file))
      );
      
      await newRequest.patch(`/orders/dispute/${selectedOrderId}`, { 
        reason: disputeReason,
        proofs 
      });
      
      alert("Dispute raised. The other party and Admin have been notified.");
      setShowDisputeModal(false);
      setDisputeReason("");
      setDisputeFiles([]);
      fetchOrders();
    } catch (err) {
      console.log(err);
      alert("Failed to raise dispute.");
    } finally {
      setUploading(false);
    }
  };

  const submitResponse = async () => {
    if (!disputeReason) return alert("Please provide a response.");
    setUploading(true);
    try {
      const proofs = await Promise.all(
        [...disputeFiles].map(async (file) => await upload(file))
      );
      
      await newRequest.patch(`/orders/dispute/respond/${selectedOrderId}`, { 
        response: disputeReason,
        proofs 
      });
      
      alert("Response submitted. Admin will review both claims.");
      setShowResponseModal(false);
      setDisputeReason("");
      setDisputeFiles([]);
      fetchOrders();
    } catch (err) {
      console.log(err);
      alert("Failed to submit response.");
    } finally {
      setUploading(false);
    }
  };

  const handleDisputeClick = (id) => {
    setSelectedOrderId(id);
    setShowDisputeModal(true);
  };

  const handleResponseClick = (id) => {
    setSelectedOrderId(id);
    setShowResponseModal(true);
  };

  const handleContact = async (order) => {
    const vendorId = order.vendorId;
    const buyerId = order.buyerId;
    const id = vendorId + buyerId;

    try {
      const res = await newRequest.get(`/conversations/single/${id}`);
      navigate(`/message/${res.data.id}`);
    } catch (err) {
      if (err.response.status === 404) {
        const res = await newRequest.post(`/conversations`, {
          to: currentUser.isVendor ? buyerId : vendorId,
        });
        navigate(`/message/${res.data.id}`);
      }
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;
    try {
      await newRequest.patch(`/orders/cancel/${id}`);
      alert("Order cancelled successfully.");
      fetchOrders();
    } catch (err) {
      console.log(err);
      alert("Error cancelling order: " + (err.response?.data || err.message));
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await newRequest.patch(`/orders/status/${id}`, { status });
      fetchOrders();
    } catch (err) {
      console.log(err);
      alert("Error updating status: " + (err.response?.data || err.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "in_progress": return "#3b82f6";
      case "delivered": return "#8b5cf6";
      case "completed": return "#10b981";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getStatusProgress = (status) => {
    switch (status) {
      case "pending": return "20%";
      case "in_progress": return "50%";
      case "delivered": return "80%";
      case "completed": return "100%";
      case "cancelled": return "0%";
      default: return "0%";
    }
  };

  return (
    <div className="orders">
        <div className="container">
          <div className="title">
            <h1>Orders & Tracking</h1>
          </div>
          <div className="orders-grid">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div className={`order-card ${order.paymentStatus}`} key={order._id}>
                  <img src={order.img || categoryDefaults[order.cat] || imageDefault} alt={order.title} />
                  <div className="order-info">
                    <div className="order-header">
                      <div className="title-wrapper">
                        <h3>{order.title}</h3>
                        <span className={`role-badge ${order.vendorId === currentUser._id ? "vendor" : "buyer"}`}>
                          {order.vendorId === currentUser._id ? "Sale" : "Purchase"}
                        </span>
                      </div>
                      <div className="status-group">
                        <span className={`status-badge ${order.paymentStatus}`}>
                          Payment: {order.paymentStatus}
                        </span>
                        <span className="order-status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                          {order.status?.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="tracking-container">
                      <div className="tracking-bar">
                        <div 
                          className="tracking-progress" 
                          style={{ 
                            width: getStatusProgress(order.status),
                            backgroundColor: getStatusColor(order.status)
                          }}
                        ></div>
                      </div>
                      <div className="tracking-labels">
                        <span>Pending</span>
                        <span>In Progress</span>
                        <span>Delivered</span>
                        <span>Completed</span>
                      </div>
                    </div>

                    <div className="order-details">
                      <div className="meta">
                        <span className="price">₹{order.price}</span>
                        <span className="method">{order.paymentMethod}</span>
                      </div>
                      <div className="order-actions">
                        {/* Vendor Status Controls */}
                        {currentUser.isVendor && order.vendorId === currentUser._id && order.status !== "completed" && order.status !== "cancelled" && (
                          <select 
                            className="status-select"
                            value={order.status} 
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="delivered">Delivered</option>
                            <option value="completed">Mark Completed</option>
                            <option value="cancelled">Cancel Order</option>
                          </select>
                        )}

                        {/* Buyer Cancellation */}
                        {order.buyerId === currentUser._id && order.status === "pending" && (
                          <div className="action-icon cancel" title="Cancel Order" onClick={() => handleCancel(order._id)}>
                            <XCircle size={18} color="#ef4444" />
                          </div>
                        )}

                        <div className="action-icon contact" title="Contact" onClick={() => handleContact(order)}>
                          <MessageSquare size={18} />
                        </div>
                        <div className="action-icon download" title="Invoice" onClick={() => handleDownload(order._id)}>
                          <Download size={18} />
                        </div>
                        
                        {/* Provider can complete manual payments */}
                        {currentUser.isVendor && order.paymentStatus === "pending" && (order.paymentMethod === "cash" || order.paymentMethod === "qr") && (
                          <div className="action-icon complete" title="Confirm Payment" onClick={() => handleComplete(order._id)}>
                            <CheckCircle size={18} color="green" />
                          </div>
                        )}

                        {/* Anyone can dispute */}
                        {order.paymentStatus !== "disputed" && ["in_progress", "delivered", "completed"].includes(order.status) && (
                          <div className="action-icon dispute" title="Raise Dispute" onClick={() => handleDisputeClick(order._id)}>
                            <AlertTriangle size={18} color="red" />
                          </div>
                        )}

                        {/* Delete entry */}
                        {(order.status === "completed" || order.status === "cancelled") && (
                          <div className="action-icon delete" title="Delete Record" onClick={() => handleDelete(order._id)}>
                            <Trash2 size={18} color="#64748b" />
                          </div>
                        )}

                        {/* Respond to dispute */}
                        {order.paymentStatus === "disputed" && order.dispute?.status === "open" && 
                         ((order.dispute.raisedBy === "buyer" && order.vendorId === currentUser._id) || 
                          (order.dispute.raisedBy === "vendor" && order.buyerId === currentUser._id)) && (
                          <button className="respond-btn" onClick={() => handleResponseClick(order._id)}>
                            Respond to Dispute
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Refund Loop UI */}
                    {order.dispute?.refundStatus && order.dispute.refundStatus !== "none" && order.dispute.refundStatus !== "completed" && (
                      <div className="refund-loop-container">
                        <div className="refund-alert">
                          <AlertTriangle size={16} />
                          <span>Admin Ruling: <strong>{order.dispute.refundPercentage}% Refund Required</strong> (₹{order.dispute.refundAmount})</span>
                        </div>
                        
                        {/* Vendor View */}
                        {order.vendorId === currentUser._id && (
                          <div className="vendor-refund-actions">
                            {order.dispute.refundStatus === "pending_vendor" && (
                              <div className="send-refund-box">
                                <p>Please send ₹{order.dispute.refundAmount} to the buyer and mark as sent.</p>
                                <div className="proof-upload-sm">
                                  <label htmlFor={`refund-proof-${order._id}`}>
                                    <Upload size={14} /> {refundProofFiles[order._id] ? "Proof selected" : "Upload Proof (Optional)"}
                                  </label>
                                  <input 
                                    type="file" 
                                    id={`refund-proof-${order._id}`} 
                                    style={{display: "none"}} 
                                    onChange={(e) => setRefundProofFiles(prev => ({ ...prev, [order._id]: e.target.files[0] }))} 
                                  />
                                </div>
                                <button className="mark-sent-btn" onClick={() => handleMarkRefundSent(order._id)} disabled={uploading}>
                                  {uploading ? "Uploading..." : "Mark Refund as Sent"}
                                </button>
                              </div>
                            )}
                            {order.dispute.refundStatus === "awaiting_buyer" && (
                              <div className="waiting-box">
                                <p>You have marked the refund as sent. Waiting for buyer to confirm.</p>
                                <button className="dispute-refund-btn secondary" onClick={() => handleRaiseRefundDispute(order._id)}>
                                  <AlertTriangle size={14} /> Buyer won't confirm?
                                </button>
                              </div>
                            )}
                            {order.dispute.refundStatus === "refund_disputed" && (
                              <div className="disputed-refund-box">
                                <p>You have raised a refund dispute. Admin will verify your proof.</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Buyer View */}
                        {order.buyerId === currentUser._id && (
                          <div className="buyer-refund-actions">
                            {order.dispute.refundStatus === "pending_vendor" && (
                              <p>Waiting for vendor to send your refund of ₹{order.dispute.refundAmount}.</p>
                            )}
                            {order.dispute.refundStatus === "awaiting_buyer" && (
                              <div className="confirm-refund-box">
                                <p>Vendor has marked refund as sent.</p>
                                {order.dispute.refundProof && <a href={order.dispute.refundProof} target="_blank" rel="noreferrer">View Vendor's Proof</a>}
                                <button className="confirm-receipt-btn" onClick={() => handleConfirmRefund(order._id)}>Confirm Receipt</button>
                              </div>
                            )}
                            {order.dispute.refundStatus === "refund_disputed" && (
                              <p>Vendor claims they paid, but you haven't confirmed. Admin is investigating.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-orders">No orders found.</p>
            )}
          </div>
        </div>

        {/* Dispute Modal */}
        {showDisputeModal && (
          <div className="modal-overlay">
            <div className="dispute-modal">
              <div className="modal-header">
                <h2>Raise a Dispute</h2>
                <X className="close-icon" onClick={() => setShowDisputeModal(false)} />
              </div>
              <div className="modal-body">
                <label>Reason for Dispute</label>
                <textarea 
                  placeholder="Explain why you are raising this dispute..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                />
                <label>Upload Evidence (Photos/Docs) - Optional</label>
                <div className="file-upload">
                  <input 
                    type="file" 
                    multiple 
                    onChange={(e) => setDisputeFiles(e.target.files)}
                  />
                  <Upload size={20} />
                </div>
                {disputeFiles.length > 0 && <p>{disputeFiles.length} files selected</p>}
                <button 
                  className="submit-dispute-btn" 
                  onClick={submitDispute}
                  disabled={uploading}
                >
                  {uploading ? "Submitting..." : "Submit Dispute"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Response Modal */}
        {showResponseModal && (
          <div className="modal-overlay">
            <div className="dispute-modal">
              <div className="modal-header">
                <h2>Respond to Dispute</h2>
                <X className="close-icon" onClick={() => setShowResponseModal(false)} />
              </div>
              <div className="modal-body">
                <label>Your Counter-Response</label>
                <textarea 
                  placeholder="Explain your side of the situation..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                />
                <label>Upload Proof of Innocence (Photos/Docs) - Optional</label>
                <div className="file-upload">
                  <input 
                    type="file" 
                    multiple 
                    onChange={(e) => setDisputeFiles(e.target.files)}
                  />
                  <Upload size={20} />
                </div>
                {disputeFiles.length > 0 && <p>{disputeFiles.length} files selected</p>}
                <button 
                  className="submit-dispute-btn response" 
                  onClick={submitResponse}
                  disabled={uploading}
                >
                  {uploading ? "Submitting..." : "Submit Response"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRefundDisputeModal && (
          <div className="modal-overlay">
            <div className="dispute-modal">
              <div className="modal-header">
                <h2>Raise Refund Dispute</h2>
                <X className="close-icon" onClick={() => setShowRefundDisputeModal(false)} />
              </div>
              <div className="modal-body">
                <p style={{fontSize: "14px", color: "#64748b", marginBottom: "10px"}}>
                  If you have already sent the refund but the buyer is not confirming, 
                  explain your situation and upload additional proof (e.g., chat screenshots, transfer receipts).
                </p>
                <label>Explanation</label>
                <textarea 
                  placeholder="Describe the situation..."
                  value={refundDisputeReason}
                  onChange={(e) => setRefundDisputeReason(e.target.value)}
                />
                <label>Additional Proof (Optional)</label>
                <div className="file-upload">
                  <Upload size={20} />
                  <span>{refundDisputeFile ? refundDisputeFile.name : "Select Screenshot"}</span>
                  <input 
                    type="file" 
                    onChange={(e) => setRefundDisputeFile(e.target.files[0])} 
                  />
                </div>
                <button 
                  className="submit-dispute-btn" 
                  onClick={submitRefundDispute}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Submit Refund Dispute"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default Orders;
