import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./MyServices.css";
import axios from "axios";
import newRequest from "../utils/newRequest";
import { Trash2, PlusCircle, Package } from "lucide-react";
import { categoryDefaults, imageDefault } from "../utils/constants";

function MyServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await newRequest.get(
        `/services?userId=${currentUser._id}`
      );
      setServices(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await newRequest.delete(`/services/${id}`);
      fetchServices();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="myServices">
        <div className="container">
          <div className="title">
            <h1>Services</h1>
            {currentUser.isVendor && (
              <Link to="/add">
                <button className="add-btn">Add New Service</button>
              </Link>
            )}
          </div>
          
          {loading ? (
            <div className="loading-state">Loading your services...</div>
          ) : services.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <Package size={64} />
              </div>
              <h2>No Services Found</h2>
              <p>You haven't created any services yet. Start your journey by offering your first service to the community.</p>
              <Link to="/add">
                <button className="create-btn">
                  <PlusCircle size={20} />
                  Create Your First Service
                </button>
              </Link>
            </div>
          ) : (
            <div className="cards-container">
              {services.map((service) => (
                <div className="service-card-item" key={service._id}>
                  <img src={service.cover || categoryDefaults[service.cat] || imageDefault} alt="" />
                  <div className="info">
                    <div className="top">
                      <span className="cat">{service.cat}</span>
                      <Trash2
                        className="delete"
                        size={20}
                        onClick={() => handleDelete(service._id)}
                      />
                    </div>
                    <h3>{service.title}</h3>
                    <div className="stats">
                      <div className="stat-item">
                        <span className="label">Price:</span>
                        <span className="value">₹{service.price}</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">Sales:</span>
                        <span className="value">{service.sales}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}

export default MyServices;
