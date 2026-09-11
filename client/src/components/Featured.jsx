import React, { useState, useEffect } from "react";
import "./Featured.css";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import newRequest from "../utils/newRequest";

function Featured() {
  const [selectedCat, setSelectedCat] = useState("");
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await newRequest.get("/services/categories");
        // Filter out any empty categories and limit to available ones
        const filteredCats = res.data.filter(Boolean);
        setCategories(filteredCats.length > 0 ? filteredCats : ["design", "web", "animation", "music", "ai", "marketing", "tech"]);
      } catch (err) {
        console.log(err);
        // Fallback categories if backend fails
        setCategories(["design", "web", "animation", "music", "ai", "marketing", "tech"]);
      }
    };
    fetchCats();
  }, []);

  const handleSubmit = () => {
    if (selectedCat) {
      navigate(`/services?cat=${selectedCat}`);
    } else {
      navigate(`/services`);
    }
  };

  return (
    <div className="featured">
      <div className="container">
        <div className="left">
          <h1>
            Find the perfect <span>university-verified</span> services for your business
          </h1>
          <div className="search">
            <div className="searchInput">
              <select
                onChange={(e) => setSelectedCat(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Select a Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown className="search-icon" size={20} color="gray" />
            </div>
            <button onClick={handleSubmit}>Select</button>
          </div>
          <div className="popular">
            <span>Popular:</span>
            <button onClick={() => navigate("/services?cat=web design")}>Web Design</button>
            <button onClick={() => navigate("/services?cat=wordpress")}>WordPress</button>
            <button onClick={() => navigate("/services?cat=logo design")}>Logo Design</button>
            <button onClick={() => navigate("/services?cat=ai")}>AI Services</button>
          </div>
        </div>
        <div className="right">
          <img src="/images/hero-bg.png" alt="Hero" />
        </div>
      </div>
    </div>
  );
}

export default Featured;
