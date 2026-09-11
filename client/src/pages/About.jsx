import React from "react";
import "./About.css";
import { Linkedin, Rocket, ShieldCheck, Users, Briefcase } from "lucide-react";

const About = () => {
  return (
    <div className="about">
      {/* Hero Section */}
      <section className="about-hero">
        <h1>Our Vision</h1>
        <p>
          UniServe is a professional, university-anchored marketplace designed 
          to facilitate high-trust service transactions between global talent and 
          visionary businesses.
        </p>
      </section>

      {/* Founder Section */}
      <section className="founder-section">
        <div className="founder-image-container">
          <img 
            src="/images/founder.jpg" 
            alt="Yashaswin Kathuri - Founder of UniServe" 
          />
        </div>
        <div className="founder-content">
          <span className="founder-title">Founder & Lead Developer</span>
          <h2>Yashaswin Kathuri</h2>
          <div className="founder-bio">
            <p>
              Yashaswin Kathuri is an aspiring full-stack developer and innovator with 
              a strong interest in building scalable digital platforms that solve 
              real-world problems. With a solid foundation in web technologies 
              such as React, Node.js, and MongoDB, he is passionate about creating 
              user-centric applications that combine functionality, performance, 
              and modern design.
            </p>
            <br />
            <p>
              The idea for UniServe was born from observing the challenges students 
              and freelancers face in finding trustworthy opportunities and reliable 
              clients. Yashaswin envisioned a platform that bridges this gap by 
              creating a secure, professional, and university-driven marketplace 
              where talent meets opportunity.
            </p>
          </div>
          
          <div className="founder-quote">
            "UniServe is not just a marketplace — it’s a platform built on trust, 
            empowering individuals to turn their skills into opportunities and 
            connections into success."
          </div>

          <div className="founder-links">
            <a 
              href="https://portfolio-seven-brown-79.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="link-btn portfolio-btn"
            >
              <Briefcase size={20} /> View Portfolio
            </a>
            <a 
              href="https://www.linkedin.com/in/yashaswin-kathuri-b46948384/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="link-btn linkedin-btn"
            >
              <Linkedin size={20} /> LinkedIn Profile
            </a>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <div className="values-grid">
        <div className="value-card">
          <div className="value-icon">
            <ShieldCheck size={32} />
          </div>
          <h3>Unmatched Trust</h3>
          <p>
            Every transaction and interaction is secured through our university-verified 
            framework, ensuring safety for both buyers and sellers.
          </p>
        </div>
        <div className="value-card">
          <div className="value-icon">
            <Rocket size={32} />
          </div>
          <h3>Pure Innovation</h3>
          <p>
            We leverage cutting-edge technology to create a seamless, high-performance 
            ecosystem for the next generation of digital talent.
          </p>
        </div>
        <div className="value-card">
          <div className="value-icon">
            <Users size={32} />
          </div>
          <h3>Global Growth</h3>
          <p>
            Our mission is to empower individuals worldwide, turning local expertise 
            into global professional success stories.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
