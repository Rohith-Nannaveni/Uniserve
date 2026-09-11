import React, { useEffect, useRef, useState } from "react";
import "./Services.css";
import ServiceCard from "../components/ServiceCard";
import newRequest from "../utils/newRequest";
import { useLocation } from "react-router-dom";
import { ChevronDown, Package } from "lucide-react";

function Services() {
  const [sort, setSort] = useState("sales");
  const [open, setOpen] = useState(false);
  const minRef = useRef();
  const maxRef = useRef();

  const { search } = useLocation();
  const [services, setServices] = useState([]);
  const [cheapest, setCheapest] = useState(null);

  const fetchServices = async (isInitial = false) => {
    try {
      const min = isInitial ? "" : (minRef.current?.value || "");
      const max = isInitial ? "" : (maxRef.current?.value || "");
      
      // Build the URL carefully to avoid "undefined" strings
      let url = `/services${search}`;
      const connector = search ? "&" : "?";
      url += `${connector}min=${min}&max=${max}&sort=${sort}`;

      const res = await newRequest.get(url);
      setServices(res.data);
      
      if (res.data.length === 0 && (min || max)) {
        const cheapestRes = await newRequest.get(
          `/services${search}${search ? "&" : "?"}sort=price&limit=1`
        );
        setCheapest(cheapestRes.data[0]);
      } else {
        setCheapest(null);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchServices(true);
  }, [search, sort]);

  const reSort = (type) => {
    setSort(type);
    setOpen(false);
  };

  const apply = () => {
    fetchServices();
  };

  const query = new URLSearchParams(search);
  const cat = query.get("cat");
  
  const catMapping = {
    "graphics": "Graphics & Design",
    "programming": "Programming & Tech",
    "web-design": "Web Design",
    "wordpress": "WordPress",
    "video": "Video & Animation",
    "writing": "Writing & Translation",
    "ai": "AI Services",
    "marketing": "Digital Marketing",
    "music": "Music & Audio",
    "data-science": "Data Science",
    "business": "Business Consulting",
    "lifestyle": "Lifestyle",
    "photography": "Photography"
  };

  const displayCat = catMapping[cat] || (cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : "Services");

  return (
    <div className="services">
        <div className="container">
          <span className="breadcrumbs">UniServe &gt; {displayCat}</span>
          <h1>{displayCat} Services</h1>
          <p>
            Explore the boundaries of art and technology with UniServe's AI artists
          </p>
          <div className="menu">
            <div className="left">
              <span>Budget</span>
              <input ref={minRef} type="number" placeholder="min" />
              <input ref={maxRef} type="number" placeholder="max" />
              <button onClick={apply}>Apply</button>
            </div>
            <div className="right">
              <span className="sortBy">Sort by</span>
              <span className="sortType">
                {sort === "sales" ? "Best Selling" : sort === "price" ? "Price: Lowest" : sort === "createdAt" ? "Newest" : "Popular"}
              </span>
              <ChevronDown onClick={() => setOpen(!open)} size={16} cursor="pointer" />
              {open && (
                <div className="rightMenu">
                  <span onClick={() => reSort("sales")}>Best Selling</span>
                  <span onClick={() => reSort("price")}>Price: Lowest</span>
                  <span onClick={() => reSort("createdAt")}>Newest</span>
                  <span onClick={() => reSort("sales")}>Popular</span>
                </div>
              )}
            </div>
          </div>
          <div className="cards">
            {services.length > 0 ? (
              services.map((service) => (
                <ServiceCard key={service._id} item={service} />
              ))
            ) : (
              <div className="empty-state-container">
                <div className="empty-state-content">
                  <div className="empty-icon">
                    <Package size={64} />
                  </div>
                  <h2>No Services Found</h2>
                  <p>
                    {search.includes("userId") 
                      ? "This user hasn't listed any services yet."
                      : "We couldn't find any services matching your current filters."}
                  </p>
                  {cheapest && (
                    <div className="suggestion-box">
                      <p>Try our most affordable option in this category:</p>
                      <div className="suggestion-card">
                        <ServiceCard item={cheapest} />
                      </div>
                    </div>
                  )}
                  <button 
                    className="reset-btn"
                    onClick={() => {
                      minRef.current.value = "";
                      maxRef.current.value = "";
                      apply();
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default Services;
