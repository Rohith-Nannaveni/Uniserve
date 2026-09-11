import React, { useState, useMemo } from "react";
import AdminVerificationHub from "./AdminVerificationHub";
import { 
  Users, 
  Briefcase, 
  AlertCircle, 
  ShoppingBag, 
  ShieldCheck, 
  AlertTriangle,
  MessageSquare
} from "lucide-react";
import moment from "moment";
import { profileDefault } from "../utils/constants";

const AdminDashboard = ({ 
  activeTab, 
  setActiveTab, 
  stats, 
  users, 
  reports,
  services, 
  pendingServices, 
  orders, 
  jobs,
  subRequests,
  pendingProfileUpdates,
  renderSubscriptionsTab,
  renderCouponsTab,
  handleResolveAppeal,
  handleResolveReport,
  handleDeleteReport,
  handleDeleteUser,
  handleBanUser,
  handleApproveService,
  handleDeleteService,
  handleResolveRefundDispute,
  handleDeleteOrder,
  handleDeleteJob,
  setSelectedDispute,
  setShowDisputeDetails
}) => {
  const [roleFilter, setRoleFilter] = useState("all");
  const [subFilter, setSubFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const roleMatch = roleFilter === "all" || u.role === roleFilter || (roleFilter === "admin" && u.isAdmin);
      const subMatch = subFilter === "all" || u.subscription === subFilter;
      return roleMatch && subMatch;
    });
  }, [users, roleFilter, subFilter]);

  return (
    <div className="dashboard-content">
      {activeTab === "overview" && (
        <>
          <div className="dashboard-grid">
            <div className="stat-card" onClick={() => setActiveTab("users")}>
              <div className="icon-wrapper"><Users size={24} /></div>
              <div className="info">
                <h3>Total Users</h3>
                <span>{users.length}</span>
              </div>
            </div>
            <div className="stat-card" onClick={() => setActiveTab("services")}>
              <div className="icon-wrapper"><Briefcase size={24} /></div>
              <div className="info">
                <h3>Active Services</h3>
                <span>{services.filter(s => s.isApproved).length}</span>
              </div>
            </div>
            <div className={`stat-card ${pendingServices.length > 0 ? "alert" : ""}`} onClick={() => setActiveTab("approvals")}>
              <div className="icon-wrapper"><AlertCircle size={24} /></div>
              <div className="info">
                <h3>Service Approvals</h3>
                <span>{pendingServices.length}</span>
              </div>
            </div>
            <div className="stat-card" onClick={() => setActiveTab("orders")}>
              <div className="icon-wrapper"><ShoppingBag size={24} /></div>
              <div className="info">
                <h3>Orders</h3>
                <span>{orders.length}</span>
              </div>
            </div>
            <div className="stat-card" onClick={() => setActiveTab("jobs")}>
              <div className="icon-wrapper"><Briefcase size={24} /></div>
              <div className="info">
                <h3>Job Postings</h3>
                <span>{jobs?.length || 0}</span>
              </div>
            </div>
            <div className={`stat-card ${stats.pendingCoupons > 0 ? "alert" : ""}`} onClick={() => setActiveTab("coupons")}>
              <div className="icon-wrapper"><ShieldCheck size={24} /></div>
              <div className="info">
                <h3>Coupons</h3>
                <span>{stats.pendingCoupons} Pending</span>
              </div>
            </div>
            <div className={`stat-card ${users.some(u => u.appealStatus === "pending") ? "alert" : ""}`} onClick={() => setActiveTab("appeals")}>
              <div className="icon-wrapper"><AlertCircle size={24} /></div>
              <div className="info">
                <h3>Governance Appeals</h3>
                <span>{users.filter(u => u.appealStatus === "pending").length}</span>
              </div>
            </div>
            <div className={`stat-card ${stats.totalDisputes > 0 ? "alert" : ""}`} onClick={() => setActiveTab("disputes")}>
              <div className="icon-wrapper"><AlertTriangle size={24} /></div>
              <div className="info">
                <h3>Disputes</h3>
                <span>{stats.totalDisputes} Open</span>
              </div>
            </div>
            <div className={`stat-card ${stats.refundDisputes > 0 ? "alert" : ""}`} onClick={() => setActiveTab("refund_disputes")}>
              <div className="icon-wrapper"><ShieldCheck size={24} /></div>
              <div className="info">
                <h3>Refund Disputes</h3>
                <span>{stats.refundDisputes} Pending</span>
              </div>
            </div>
            <div className={`stat-card ${stats.pendingSubscriptions > 0 ? "alert" : ""}`} onClick={() => setActiveTab("subscriptions")}>
              <div className="icon-wrapper"><ShieldCheck size={24} /></div>
              <div className="info">
                <h3>Subscription Approvals</h3>
                <span>{stats.pendingSubscriptions || 0} New</span>
              </div>
            </div>
            <div className={`stat-card ${stats.pendingReports > 0 ? "alert" : ""}`} onClick={() => setActiveTab("reports")}>
              <div className="icon-wrapper"><AlertTriangle size={24} color="#ef4444" /></div>
              <div className="info">
                <h3>Institutional Disputes</h3>
                <span>{stats.pendingReports || 0} Open</span>
              </div>
            </div>
            <div className={`stat-card ${(stats.pendingVerifications > 0 || pendingProfileUpdates?.length > 0) ? "alert" : ""}`} onClick={() => setActiveTab("verifications")}>
              <div className="icon-wrapper"><ShieldCheck size={24} /></div>
              <div className="info">
                <h3>Student/HR/PO/Profile Update Approvals</h3>
                <span>{(stats.pendingVerifications || 0) + (pendingProfileUpdates?.length || 0)} New</span>
              </div>
            </div>
          </div>

          <div className="admin-actions">
            <div className="section-header">
              <h2>Administrative Control Center</h2>
            </div>
            <div className="action-grid">
              <button className="action-btn" onClick={() => setActiveTab("verifications")}>Verify Users & Profile Updates</button>
              <button className="action-btn" onClick={() => setActiveTab("approvals")}>Verify New Services</button>
              <button className="action-btn" onClick={() => setActiveTab("services")}>Moderate Marketplace</button>
              <button className="action-btn" onClick={() => setActiveTab("users")}>Manage User Access</button>
              <button className="action-btn" onClick={() => setActiveTab("appeals")}>Review Ban Appeals</button>
              <button className="action-btn" onClick={() => setActiveTab("coupons")}>Manage Promotions</button>
              <button className="action-btn" onClick={() => setActiveTab("subscriptions")}>Subscription Requests</button>
              <button className="action-btn" onClick={() => setActiveTab("disputes")}>Resolve Disputes</button>
              <button className="action-btn" onClick={() => setActiveTab("refund_disputes")}>Refund Verification</button>
              <button className="action-btn" onClick={() => setActiveTab("orders")}>Platform Orders</button>
              <button className="action-btn" onClick={() => setActiveTab("jobs")}>Moderate Job Postings</button>
              <button className="action-btn" onClick={() => setActiveTab("reports")}>Institutional Governance Reports</button>
            </div>
          </div>
        </>
      )}

      {activeTab === "jobs" && (
        <div className="admin-table-container">
          <div className="section-header">
            <h2>Job Portal Management</h2>
          </div>
          {jobs?.length === 0 ? (
            <p className="empty-msg">No job postings found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Job Role</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j._id}>
                    <td>{j.jobRole}</td>
                    <td>{j.companyName}</td>
                    <td><span className={`status-pill ${j.status}`}>{j.status}</span></td>
                    <td>
                      <div className="table-actions">
                        <button className="action-btn-sm delete" onClick={() => handleDeleteJob(j._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "gov_reports" && (
        <div className="admin-table-container">
          <div className="section-header">
            <h2>Institutional Governance Reports</h2>
            <p>Review and resolve disputes between POs and HRs.</p>
          </div>
          {reports?.filter(r => r.category === "institutional_dispute").length === 0 ? (
            <p className="empty-msg">No governance reports found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reported Party</th>
                  <th>Reason/Proofs</th>
                  <th>Counter-Response</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.filter(r => r.category === "institutional_dispute").map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="user-info">
                        <strong>{r.reportedId?.username}</strong>
                        <small>{r.reportedId?.role?.toUpperCase()}</small>
                        <span className={`status-pill ${r.reportedId?.reliabilityStatus}`}>{r.reportedId?.reliabilityStatus}</span>
                      </div>
                    </td>
                    <td>
                      <div className="report-detail-cell">
                        <p>{r.reason}</p>
                        {r.proofs?.length > 0 && (
                          <div className="doc-links">
                            {r.proofs.map((p, i) => <a key={i} href={p} target="_blank" rel="noreferrer">Proof {i+1}</a>)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {r.response ? (
                        <div className="report-detail-cell">
                          <p>{r.response}</p>
                          {r.responseProofs?.length > 0 && (
                            <div className="doc-links">
                              {r.responseProofs.map((p, i) => <a key={i} href={p} target="_blank" rel="noreferrer">Proof {i+1}</a>)}
                            </div>
                          )}
                        </div>
                      ) : <span className="text-muted">No response yet</span>}
                    </td>
                    <td>
                      {r.status === "pending" || r.status === "under_review" ? (
                        <div className="table-actions-stack" style={{display: "flex", flexDirection: "column", gap: "5px"}}>
                          <button className="action-btn-sm approve" onClick={() => handleResolveReport(r._id, "warning")}>Issue Warning</button>
                          <button className="action-btn-sm ban" onClick={() => handleResolveReport(r._id, "suspension")}>Suspend Account</button>
                          <button className="action-btn-sm resolve" onClick={() => handleResolveReport(r._id, "dismissal")}>Dismiss Report</button>
                          <button className="action-btn-sm delete" onClick={() => handleDeleteReport(r._id)}>Delete Entry</button>
                        </div>
                      ) : (
                        <div className="table-actions-stack" style={{display: "flex", flexDirection: "column", gap: "5px"}}>
                          <span className={`status-pill ${r.status}`}>{r.status.toUpperCase()}</span>
                          <button className="action-btn-sm delete" onClick={() => handleDeleteReport(r._id)}>Delete Entry</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="admin-table-container">
          <div className="section-header">
            <h2>Institutional Governance Disputes</h2>
            <p>Manage and resolve formal disputes between Corporate HR Partners and University Placement Officers.</p>
          </div>
          {reports?.length === 0 ? (
            <p className="empty-msg">No institutional disputes found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Reporter (Organization)</th>
                  <th>Reported Party</th>
                  <th>Category</th>
                  <th>Reason/Proofs</th>
                  <th>Counter-Response</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="user-info">
                        <strong>{r.reporterId?.role === "hr" ? r.reporterId?.hrVerification?.companyName : r.reporterId?.university || r.reporterId?.username}</strong>
                        <small>{r.reporterId?.username} ({r.reporterId?.role?.toUpperCase()})</small>
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <strong>{r.reportedId?.role === "hr" ? r.reportedId?.hrVerification?.companyName : r.reportedId?.university || r.reportedId?.username}</strong>
                        <small>{r.reportedId?.username} ({r.reportedId?.role?.toUpperCase()})</small>
                        <span className={`status-pill ${r.reportedId?.reliabilityStatus}`}>{r.reportedId?.reliabilityStatus}</span>
                      </div>
                    </td>
                    <td><span className="type-pill">{r.category}</span></td>
                    <td>
                      <div className="report-detail-cell">
                        <p>{r.reason}</p>
                        {r.proofs?.length > 0 && (
                          <div className="doc-links">
                            {r.proofs.map((p, i) => <a key={i} href={p} target="_blank" rel="noreferrer">Proof {i+1}</a>)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {r.response ? (
                        <div className="report-detail-cell">
                          <p>{r.response}</p>
                          {r.responseProofs?.length > 0 && (
                            <div className="doc-links">
                              {r.responseProofs.map((p, i) => <a key={i} href={p} target="_blank" rel="noreferrer">Proof {i+1}</a>)}
                            </div>
                          )}
                        </div>
                      ) : <span className="text-muted">No response yet</span>}
                    </td>
                    <td>
                      {r.status === "pending" || r.status === "under_review" ? (
                        <div className="table-actions-stack">
                          <button className="action-btn-sm approve" onClick={() => handleResolveReport(r._id, "warning")}>Issue Warning (Low Badge)</button>
                          <button className="action-btn-sm ban" onClick={() => handleResolveReport(r._id, "suspension")}>Suspend Account</button>
                          <button className="action-btn-sm resolve" onClick={() => handleResolveReport(r._id, "dismissal")}>Dismiss Report</button>
                          <button className="action-btn-sm delete" onClick={() => handleDeleteReport(r._id)}>Delete Entry</button>
                        </div>
                      ) : (
                        <div className="table-actions-stack">
                          <span className={`status-pill ${r.status}`}>{r.status.toUpperCase()}</span>
                          <button className="action-btn-sm delete" onClick={() => handleDeleteReport(r._id)}>Delete Entry</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="admin-table-container">
          <div className="section-header">
            <h2>User Management</h2>
            <div className="filter-controls">
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="hr">HRs</option>
                <option value="po">POs</option>
                <option value="admin">Admins</option>
              </select>
              <select 
                value={subFilter} 
                onChange={(e) => setSubFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Tiers</option>
                <option value="normal">Normal</option>
                <option value="premium">Premium</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Subscription</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="user-info">
                      <img 
                        src={u.img || profileDefault} 
                        alt="" 
                        onError={(e) => { e.target.onerror = null; e.target.src = profileDefault; }}
                      />
                      <span>{u.username}</span>
                    </div>
                  </td>
                  <td>{u.isAdmin ? "Admin" : u.role.toUpperCase()}</td>
                  <td>
                    <span className={`sub-pill ${u.subscription}`}>
                      {u.subscription.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${u.isBanned ? "banned" : "active"}`}>
                      {u.isBanned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className={`action-btn-sm ${u.isBanned ? "unban" : "ban"}`}
                        onClick={() => handleBanUser(u._id)}
                      >
                        {u.isBanned ? "Unban" : "Ban"}
                      </button>
                      <button className="action-btn-sm delete" onClick={() => handleDeleteUser(u._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "services" && (
        <div className="admin-table-container">
          <div className="section-header">
            <h2>Marketplace Services</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s._id}>
                  <td>{s.title}</td>
                  <td>{s.cat}</td>
                  <td>₹{s.price}</td>
                  <td>
                    <button className="action-btn-sm delete" onClick={() => handleDeleteService(s._id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "approvals" && (
        <div className="admin-table-container">
          <div className="section-header">
            <h2>Pending Service Approvals</h2>
          </div>
          {pendingServices.length === 0 ? (
            <p className="empty-msg">No services waiting for approval.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingServices.map((s) => (
                  <tr key={s._id}>
                    <td>{s.title}</td>
                    <td>{s.cat}</td>
                    <td>
                      <div className="table-actions">
                        <button className="action-btn-sm approve" onClick={() => handleApproveService(s._id)}>Approve</button>
                        <button className="action-btn-sm delete" onClick={() => handleDeleteService(s._id)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "refund_disputes" && (
        <div className="admin-table-container">
          <div className="section-header">
            <h2>Refund Verification</h2>
          </div>
          {orders.filter(o => o.dispute?.refundStatus === "refund_disputed").length === 0 ? (
            <p className="empty-msg">No pending refund disputes.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Claims</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter(o => o.dispute?.refundStatus === "refund_disputed").map((o) => (
                  <tr key={o._id}>
                    <td>Order #{o._id.slice(-6)}</td>
                    <td>{o.dispute.refundDisputeReason}</td>
                    <td>
                      <div className="table-actions">
                        <button className="action-btn-sm approve" onClick={() => handleResolveRefundDispute(o._id, "approve")}>Confirm</button>
                        <button className="action-btn-sm delete" onClick={() => handleResolveRefundDispute(o._id, "reject")}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="admin-table-container">
          <div className="section-header">
            <h2>Platform Orders</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>{o._id}</td>
                  <td>₹{o.price}</td>
                  <td>{o.status}</td>
                  <td>
                    <button className="action-btn-sm delete" onClick={() => handleDeleteOrder(o._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "disputes" && (
        <div className="admin-table-container">
          <div className="section-header">
            <h2>Dispute Management</h2>
          </div>
          {orders.filter(o => o.paymentStatus === "disputed").length === 0 ? (
            <p className="empty-msg">No active disputes.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter(o => o.paymentStatus === "disputed").map((o) => (
                  <tr key={o._id}>
                    <td>{o._id}</td>
                    <td>₹{o.price}</td>
                    <td>
                      <button 
                        className="action-btn-sm resolve" 
                        onClick={() => {
                          setSelectedDispute(o);
                          setShowDisputeDetails(true);
                        }}
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "appeals" && (
        <div className="admin-table-container">
          <div className="section-header">
            <h2>Governance & Ban Appeals</h2>
          </div>
          {users.filter(u => u.appealStatus === "pending").length === 0 ? (
            <p className="empty-msg">No pending appeals.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Appeal Reason</th>
                  <th>Proofs</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.appealStatus === "pending").map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="user-info">
                        <span>{u.username}</span>
                        <small>{u.email}</small>
                      </div>
                    </td>
                    <td>{u.role.toUpperCase()}</td>
                    <td>
                      <div style={{display: "flex", flexDirection: "column", gap: "2px"}}>
                        <span className={`status-pill ${u.reliabilityStatus}`}>
                          Rel: {u.reliabilityStatus.toUpperCase()}
                        </span>
                        {u.isBanned && <span className="status-pill banned">BANNED</span>}
                      </div>
                    </td>
                    <td className="reason-cell">
                      <div className="reason-text" style={{maxWidth: "250px", fontSize: "0.85rem"}}>{u.appealReason}</div>
                    </td>
                    <td>
                      {u.appealDocuments?.length > 0 ? (
                        <div className="doc-links">
                          {u.appealDocuments.map((doc, i) => (
                            <a key={i} href={doc} target="_blank" rel="noreferrer" className="doc-link">Proof {i+1}</a>
                          ))}
                        </div>
                      ) : <span className="text-muted">No docs</span>}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="action-btn-sm approve" onClick={() => handleResolveAppeal(u._id, "unsuspend")}>Unsuspend / Unban</button>
                        <button className="action-btn-sm delete" onClick={() => handleResolveAppeal(u._id, "punishment")}>Finalize Punishment</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "coupons" && renderCouponsTab()}
      {activeTab === "subscriptions" && renderSubscriptionsTab()}

      {activeTab === "verifications" && (
        <div className="admin-table-container">
          <div className="section-header">
            <h2>Professional & Student Verifications</h2>
            <button className="back-btn" onClick={() => setActiveTab("overview")}>Back to Overview</button>
          </div>
          <AdminVerificationHub />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
