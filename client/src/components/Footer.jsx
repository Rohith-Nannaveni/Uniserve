import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Youtube, 
  Globe 
} from "lucide-react";

function Footer() {
  return (
    <div className="footer">
      <div className="container">
        <div className="top">
          <div className="item">
            <h2>Categories</h2>
            <Link to="/services?cat=graphics">Graphics & Design</Link>
            <Link to="/services?cat=marketing">Digital Marketing</Link>
            <Link to="/services?cat=writing">Writing & Translation</Link>
            <Link to="/services?cat=video">Video & Animation</Link>
            <Link to="/services?cat=music">Music & Audio</Link>
            <Link to="/services?cat=programming">Programming & Tech</Link>
            <Link to="/services?cat=data-science">Data Science</Link>
            <Link to="/services?cat=business">Business Consulting</Link>
            <Link to="/services?cat=lifestyle">Lifestyle</Link>
            <Link to="/services?cat=photography">Photography</Link>
          </div>
          <div className="item">
            <h2>About</h2>
            <Link to="/about">About Us</Link>
            <Link to="/about">Press & News</Link>
            <Link to="/about">Partnerships</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/about">Intellectual Property Claims</Link>
            <Link to="/about">Investor Relations</Link>
          </div>
          <div className="item">
            <h2>Support</h2>
            <Link to="/support">Help & Support</Link>
            <Link to="/support">Trust & Safety</Link>
            <Link to="/support">Selling on UniServe</Link>
            <Link to="/support">Buying on UniServe</Link>
          </div>
          <div className="item">
            <h2>Community</h2>
            <Link to="/about">Customer Success Stories</Link>
            <Link to="/about">Community hub</Link>
            <Link to="/about">Forum</Link>
            <Link to="/about">Events</Link>
            <Link to="/about">Blog</Link>
            <Link to="/about">Influencers</Link>
            <Link to="/about">Affiliates</Link>
          </div>
          <div className="item">
            <h2>More From UniServe</h2>
            <Link to="/business-talent">UniServe Business</Link>
            <Link to="/subscription">UniServe Pro</Link>
            <Link to="/about">UniServe Guides</Link>
            <Link to="/about">Get Inspired</Link>
          </div>
        </div>
        <hr />
        <div className="bottom">
          <div className="left">
            <Link to="/" className="logo">
              <img src="/images/logo.png" alt="UniServe" height="24" />
              <h2>UniServe</h2>
            </Link>
            <span>© UniServe International Ltd. 2026</span>
          </div>
          <div className="right">
            <div className="social">
              <a href="https://twitter.com" target="_blank" rel="noreferrer"><Twitter size={20} /></a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer"><Facebook size={20} /></a>
              <a href="https://www.linkedin.com/in/yashaswin-kathuri-b46948384/" target="_blank" rel="noreferrer"><Linkedin size={20} /></a>
              <a href="https://www.instagram.com/this_is_yashaswin/" target="_blank" rel="noreferrer"><Instagram size={20} /></a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer"><Youtube size={20} /></a>
            </div>
            <div className="link">
              <Globe size={20} />
              <span>English</span>
            </div>
            <div className="link">
              <span>₹ INR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
