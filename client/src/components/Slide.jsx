import React, { useState, useEffect, useRef } from "react";
import "./Slide.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

const getResponsiveCount = (max) => {
  if (typeof window === "undefined") return max;
  if (window.innerWidth <= 480) return 1;
  if (window.innerWidth <= 768) return 2;
  return max;
};

const Slide = ({ children, slidesToShow = 5 }) => {
  const [effectiveSlides, setEffectiveSlides] = useState(() => getResponsiveCount(slidesToShow));
  const [currentIndex, setCurrentIndex] = useState(() => getResponsiveCount(slidesToShow));
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const next = getResponsiveCount(slidesToShow);
      setEffectiveSlides(next);
      setCurrentIndex(next);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [slidesToShow]);

  const totalChildren = React.Children.count(children);

  // Clone children for circular loop
  const clonedChildren = [
    ...React.Children.toArray(children).slice(-effectiveSlides),
    ...React.Children.toArray(children),
    ...React.Children.toArray(children).slice(0, effectiveSlides),
  ];

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => prev - 1);
  };

  useEffect(() => {
    const handleTransitionEnd = () => {
      if (currentIndex >= totalChildren + effectiveSlides) {
        setTransitionEnabled(false);
        setCurrentIndex(effectiveSlides);
      }
      if (currentIndex <= 0) {
        setTransitionEnabled(false);
        setCurrentIndex(totalChildren);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("transitionend", handleTransitionEnd);
    }
    return () => {
      if (container) {
        container.removeEventListener("transitionend", handleTransitionEnd);
      }
    };
  }, [currentIndex, totalChildren, effectiveSlides]);

  useEffect(() => {
    if (!transitionEnabled) {
      containerRef.current.getBoundingClientRect();
      setTransitionEnabled(true);
    }
  }, [transitionEnabled]);

  return (
    <div className="slide">
      <div className="container">
        <button className="arrow left" onClick={handlePrev}>
          <ChevronLeft size={30} />
        </button>
        <div className="wrapper">
          <div
            className="slider-content"
            ref={containerRef}
            style={{
              transform: `translateX(-${currentIndex * (100 / effectiveSlides)}%)`,
              transition: transitionEnabled ? "all 0.5s ease" : "none",
            }}
          >
            {clonedChildren.map((child, index) => (
              <div
                key={index}
                className="slide-item"
                style={{ flex: `0 0 ${100 / effectiveSlides}%` }}
              >
                {child}
              </div>
            ))}
          </div>
        </div>
        <button className="arrow right" onClick={handleNext}>
          <ChevronRight size={30} />
        </button>
      </div>
    </div>
  );
};

export default Slide;
