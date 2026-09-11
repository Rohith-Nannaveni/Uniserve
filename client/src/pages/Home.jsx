import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import Featured from "../components/Featured";
import CatCard from "../components/CatCard";
import Slide from "../components/Slide";
import { CheckCircle2 } from "lucide-react";

const cards = [
  { id: 1, title: "AI Artists", desc: "Add talent to AI", img: "/images/cat-ai.png", cat: "ai" },
  { id: 2, title: "Graphics", desc: "Build your brand", img: "/images/cat-design.png", cat: "graphics" },
  { id: 3, title: "WordPress", desc: "Customize your site", img: "/images/cat-tech.png", cat: "wordpress" },
  { id: 4, title: "Voice Over", desc: "Share your message", img: "/images/cat-music.png", cat: "music" },
  { id: 5, title: "Video Explainer", desc: "Engage your audience", img: "/images/cat-video.png", cat: "video" },
  { id: 6, title: "Consulting", desc: "Reach more customers", img: "/images/cat-business.png", cat: "business" },
  { id: 7, title: "Writing", desc: "Unlock growth online", img: "/images/cat-writing.png", cat: "writing" },
];

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <Featured />
      
      <div className="trustedBy">
        <div className="container">
          <span>Trusted by:</span>
          <img src="/images/partners.png" alt="Partners" />
        </div>
      </div>

      <div className="categories">
          <h2>Popular professional services</h2>
          <Slide slidesToShow={5}>
            {cards.map((card) => (
              <CatCard key={card.id} card={card} />
            ))}
          </Slide>
      </div>

      <div className="features">
        <div className="container">
          <div className="item">
            <h1>A whole world of university-verified talent at your fingertips</h1>
            <div className="title">
              <CheckCircle2 size={24} color="gray" />
              The best for every budget
            </div>
            <p>Find high-quality services at every price point. No hourly rates, just project-based pricing.</p>
            
            <div className="title">
              <CheckCircle2 size={24} color="gray" />
              Quality work done quickly
            </div>
            <p>Find the right freelancer to begin working on your project within minutes.</p>
            
            <div className="title">
              <CheckCircle2 size={24} color="gray" />
              Protected payments, every time
            </div>
            <p>Always know what you'll pay upfront. Your payment isn't released until you approve the work.</p>

            <div className="title">
              <CheckCircle2 size={24} color="gray" />
              24/7 support
            </div>
            <p>Questions? Our round-the-clock support team is available to help anytime, anywhere.</p>
          </div>
          <div className="item">
            <video 
              src={import.meta.env.DEV ? "/feature-video.mp4" : "https://res.cloudinary.com/uniserve-sdp/video/upload/v1776078198/owtvype22nlrfgjdgv1m.mp4"} 
              controls
            ></video>
          </div>
        </div>
      </div>

      <div className="features dark">
        <div className="container">
          <div className="item">
            <h1>UniServe <i>Business</i></h1>
            <h1>A business solution designed for <i>teams</i></h1>
            <p>Upgrade to a curated experience packed with tools and benefits, dedicated to businesses</p>
            <div className="title">
              <CheckCircle2 size={20} color="white" />
              Connect to freelancers with proven business experience
            </div>
            <div className="title">
              <CheckCircle2 size={20} color="white" />
              Get matched with the perfect talent by a customer success manager
            </div>
            <div className="title">
              <CheckCircle2 size={20} color="white" />
              Manage teamwork and boost productivity with one powerful dashboard
            </div>
            <button onClick={() => navigate("/business-talent")}>Explore UniServe Business</button>
          </div>
          <div className="item">
            <img src="/images/hero-alt-bg.png" alt="" />
          </div>
        </div>
      </div>

      <div className="successStory">
        <div className="container">
          <div className="item">
            <img src="/images/success-story.png" alt="" />
          </div>
          <div className="item">
            <h2>Verified University Talent</h2>
            <p>"UniServe has transformed how we hire for our student-led startup. The verification system gives us the confidence we need to collaborate effectively."</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
