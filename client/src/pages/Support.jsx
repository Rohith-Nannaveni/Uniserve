import React from "react";
import "./Support.css";
import { ShoppingBag, Briefcase, ShieldAlert, MessageCircle, Mail, HelpCircle, ArrowRight } from "lucide-react";

const Support = () => {
  return (
    <div className="support-page">
      {/* Header Section */}
      <header className="support-header">
        <h1>Help & Support</h1>
        <p>How can we help you today? Explore our guides or reach out to our team.</p>
      </header>

      {/* Support Content */}
      <main className="support-content">
        <div className="support-grid">
          <div className="support-card">
            <div className="support-icon"><ShoppingBag size={32} /></div>
            <h3>Buying</h3>
            <p>Learn how to find and purchase services from our verified talent. Discover tips for choosing the right provider.</p>
          </div>
          <div className="support-card">
            <div className="support-icon"><Briefcase size={32} /></div>
            <h3>Selling</h3>
            <p>Guides on creating a successful service listing, managing your orders, and growing your freelance career.</p>
          </div>
          <div className="support-card">
            <div className="support-icon"><ShieldAlert size={32} /></div>
            <h3>Trust & Safety</h3>
            <p>Our commitment to security. Learn about our verification process and how we protect every transaction.</p>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="contact-options">
          <div className="contact-method">
            <div className="method-icon"><MessageCircle size={32} /></div>
            <div className="method-info">
              <h4>Live Chat Support</h4>
              <p>Connect with our expert team for immediate assistance. Available for premium subscribers.</p>
              <a href="#" className="method-link">Start Chat <ArrowRight size={16} /></a>
            </div>
          </div>
          
          <div className="contact-method">
            <div className="method-icon"><Mail size={32} /></div>
            <div className="method-info">
              <h4>Email Support</h4>
              <p>Have a complex issue? Send us an email and we'll get back to you within 24 hours.</p>
              <a href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL || 'support@uniserve.demo'}`} className="method-link">Send Email <ArrowRight size={16} /></a>
            </div>
          </div>

          <div className="contact-method">
            <div className="method-icon"><HelpCircle size={32} /></div>
            <div className="method-info">
              <h4>Resolution Center</h4>
              <p>Open a dispute or track your ongoing support tickets in one dedicated dashboard.</p>
              <a href="#" className="method-link">Go to Center <ArrowRight size={16} /></a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Support;
