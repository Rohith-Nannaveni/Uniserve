import React, { useEffect, useState } from "react";
import "./MyApplications.css";
import newRequest from "../utils/newRequest";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { Info, ExternalLink } from "lucide-react";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await newRequest.get("/applications/student");
        setApplications(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to withdraw this application?")) {
      try {
        await newRequest.delete(`/applications/${id}`);
        setApplications(applications.filter(app => app._id !== id));
      } catch (err) {
        alert("Failed to delete application");
      }
    }
  };

  if (loading) return <div className="loader">Loading...</div>;

  return (
    <div className="my-applications">
      <div className="container">
        <div className="header">
          <h1>My Job Applications</h1>
          <p>Track the status of your job applications here.</p>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <p>You haven't applied for any jobs yet.</p>
            <button className="browse-jobs-btn" onClick={() => navigate("/job-board")}>
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="apps-list-v2">
            {applications.map((app) => (
              <div key={app._id} className="app-card-v2">
                <div className="app-main-info">
                  <div className="job-meta">
                    <h3>{app.jobId?.jobRole}</h3>
                    <span className="company">{app.hrId?.hrVerification?.companyName || app.jobId?.companyName}</span>
                  </div>
                  <div className="app-status">
                    <span className={`status-pill ${app.status}`}>{app.status}</span>
                    <small>Applied {moment(app.createdAt).fromNow()}</small>
                  </div>
                </div>

                {app.recruitmentDetails && (app.status === "shortlisted" || app.status === "interview" || app.status === "hired") && (
                  <div className="hr-details-banner">
                    <div className="banner-header">
                      <Info size={16} />
                      <strong>Important Update from HR</strong>
                    </div>
                    <p>{app.recruitmentDetails}</p>
                  </div>
                )}

                <div className="app-footer">
                  <button className="view-job-link" onClick={() => navigate(`/job/${app.jobId?._id}`)}>
                    View Job Details <ExternalLink size={14} />
                  </button>
                  <button className="withdraw-btn" onClick={() => handleDelete(app._id)}>Withdraw Application</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
