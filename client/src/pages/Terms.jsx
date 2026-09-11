import React from "react";
import "./Terms.css";

const Terms = () => {
  return (
    <div className="terms-page">
      {/* Header Section */}
      <header className="terms-header">
        <h1>Terms of Service</h1>
        <p>Last updated: March 17, 2026</p>
      </header>

      {/* Main Content */}
      <main className="terms-content">
        <div className="acceptance-card">
          <p>
            Please read these Terms of Service carefully before using the UniServe 
            platform. By accessing our services, you agree to be bound by these rules.
          </p>
        </div>

        <section className="terms-section">
          <h2>
            <div className="section-number">01</div>
            Acceptance of Terms
          </h2>
          <p>
            By accessing or using the UniServe platform, you agree to comply with 
            and be bound by these Terms of Service. If you do not agree to these 
            terms, you are prohibited from using our services.
          </p>
          <p>
            We reserve the right to modify these terms at any time. Your continued 
            use of the platform after updates constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="terms-section">
          <h2>
            <div className="section-number">02</div>
            User Eligibility & Accounts
          </h2>
          <p>To use UniServe, you must meet the following criteria:</p>
          <ul className="terms-list">
            <li>You must be at least 18 years old or have legal guardian consent.</li>
            <li>You must provide accurate and complete registration information.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>One person is permitted to hold only one primary account.</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>
            <div className="section-number">03</div>
            Service Provider Obligations
          </h2>
          <p>As a provider on UniServe, you agree to:</p>
          <ul className="terms-list">
            <li>Deliver services as described in your service listings.</li>
            <li>Ensure all work is original and does not infringe on intellectual property.</li>
            <li>Communicate professionally with buyers at all times.</li>
            <li>Adhere to the agreed-upon delivery timelines and milestones.</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>
            <div className="section-number">04</div>
            Payments & Transactions
          </h2>
          <p>
            All payments on UniServe must be processed through our integrated 
            payment systems (Razorpay, UPI, or Provider QR). 
          </p>
          <ul className="terms-list">
            <li>Attempting to bypass platform payments is a violation of these terms.</li>
            <li>Service fees are clearly stated during the checkout process.</li>
            <li>Refunds are handled according to our dispute resolution policy.</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>
            <div className="section-number">05</div>
            Prohibited Conduct
          </h2>
          <p>Users are strictly prohibited from:</p>
          <ul className="terms-list">
            <li>Posting fraudulent, misleading, or illegal service listings.</li>
            <li>Harassing other users or platform administrators.</li>
            <li>Spamming, phishing, or distributing malware.</li>
            <li>Manipulating reviews or ratings through deceptive practices.</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>
            <div className="section-number">06</div>
            Termination of Service
          </h2>
          <p>
            UniServe reserves the right to suspend or terminate accounts that 
            violate these Terms of Service without prior notice.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Terms;
