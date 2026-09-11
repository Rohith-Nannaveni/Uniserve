import React from "react";
import "./Privacy.css";
import { Shield, UserCheck, Eye, Lock, Globe, Mail } from "lucide-react";

const Privacy = () => {
  return (
    <div className="privacy-page">
      {/* Header Section */}
      <header className="privacy-header">
        <h1>Privacy Policy</h1>
        <p>Last updated: March 17, 2026</p>
      </header>

      {/* Main Content */}
      <main className="privacy-content">
        <section className="privacy-section">
          <h2>
            <div className="section-icon"><Shield size={24} /></div>
            1. Introduction
          </h2>
          <p>
            Welcome to UniServe. We are committed to protecting your personal 
            information and your right to privacy. This Privacy Policy explains 
            how we collect, use, and share your data when you use our marketplace.
          </p>
          <p>
            By using UniServe, you agree to the collection and use of information 
            in accordance with this policy. We take your security seriously and 
            continuously update our systems to meet global standards.
          </p>
        </section>

        <section className="privacy-section">
          <h2>
            <div className="section-icon"><UserCheck size={24} /></div>
            2. Information We Collect
          </h2>
          <p>We collect personal information that you voluntarily provide to us when you:</p>
          <ul className="privacy-list">
            <li>Register on the platform (Name, Email, Phone Number).</li>
            <li>Create a service profile (Portfolio links, descriptions, pricing).</li>
            <li>Participate in activities on the marketplace (Messaging, Reviews).</li>
            <li>Contact our support team or provide feedback.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>
            <div className="section-icon"><Eye size={24} /></div>
            3. How We Use Your Information
          </h2>
          <p>Your information is used to facilitate the marketplace experience, including:</p>
          <ul className="privacy-list">
            <li>Processing payments through secure gateways like Razorpay.</li>
            <li>Verifying user identities to maintain a high-trust environment.</li>
            <li>Improving our matching algorithms to suggest the best services.</li>
            <li>Sending important account updates and security alerts.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>
            <div className="section-icon"><Lock size={24} /></div>
            4. Data Security & Retention
          </h2>
          <p>
            We implement industry-standard administrative, technical, and physical 
            security measures to protect your data. This includes end-to-end 
            encryption for messaging and secure token-based authentication.
          </p>
          <p>
            We retain your information only for as long as necessary to provide 
            you with our services and as required by law.
          </p>
        </section>

        <section className="privacy-section">
          <h2>
            <div className="section-icon"><Globe size={24} /></div>
            5. Third-Party Sharing
          </h2>
          <p>
            We do not sell your personal data. We only share information with 
            service providers necessary for platform operations, such as:
          </p>
          <ul className="privacy-list">
            <li>Payment processors for secure transactions.</li>
            <li>Cloud hosting services for platform reliability.</li>
            <li>Email automation services for account communications.</li>
          </ul>
        </section>

        {/* Contact CTA */}
        <div className="contact-card">
          <h2>Have Questions?</h2>
          <p>Our privacy team is here to help you understand your data rights.</p>
          <a href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL || 'support@uniserve.demo'}`} className="contact-email">
            <Mail size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Contact Support
          </a>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
