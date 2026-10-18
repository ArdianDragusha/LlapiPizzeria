"use client";

import { useEffect, useState } from "react";

const advertisements = ["AD", "AD", "AD"];

// Add new menu categories to this list.
const menuCategories = [
  "Pizzas",
  "Kebabs",
  "Grill & meats",
  "Drinks",
  "Desserts",
];

export default function HomeContent() {
  const [activeAdvertisement, setActiveAdvertisement] = useState(0);
  const [activeCategory, setActiveCategory] = useState(menuCategories[0]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (
      isPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const rotation = window.setInterval(() => {
      setActiveAdvertisement((current) => (current + 1) % advertisements.length);
    }, 5000);

    return () => window.clearInterval(rotation);
  }, [isPaused]);

  function showPreviousAdvertisement() {
    setActiveAdvertisement(
      (current) => (current - 1 + advertisements.length) % advertisements.length,
    );
  }

  function showNextAdvertisement() {
    setActiveAdvertisement((current) => (current + 1) % advertisements.length);
  }

  return (
    <>
      <section
        className={`advertisement advertisement-${activeAdvertisement + 1}`}
        aria-label="Advertisement carousel"
        aria-roledescription="carousel"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsPaused(false);
          }
        }}
      >
        <div
          className="advertisement-placeholder"
          role="group"
          aria-roledescription="slide"
          aria-label={`Advertisement ${activeAdvertisement + 1} of ${advertisements.length}`}
        >
          <span className="advertisement-emoji" aria-hidden="true">
            {advertisements[activeAdvertisement]}
          </span>
          <p>ADD AD HERE</p>
        </div>

        <div className="advertisement-controls">
          <div className="advertisement-dots" aria-label="Choose advertisement">
            {advertisements.map((advertisement, index) => (
              <button
                key={advertisement}
                type="button"
                className={`advertisement-dot${index === activeAdvertisement ? " is-active" : ""}`}
                aria-label={`Show advertisement ${index + 1}`}
                aria-current={index === activeAdvertisement ? "true" : undefined}
                onClick={() => setActiveAdvertisement(index)}
              />
            ))}
          </div>

          <div className="advertisement-arrows">
            <button
              type="button"
              aria-label="Previous advertisement"
              onClick={showPreviousAdvertisement}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              aria-label="Next advertisement"
              onClick={showNextAdvertisement}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </section>

      <section className="menu-section" aria-labelledby="menu-title">
        <div className="menu-intro">
          <h1 id="menu-title">Menu</h1>
          <p>
            Describe menu here.
          </p>
        </div>

        <div className="menu-categories" role="group" aria-label="Menu categories">
          {menuCategories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={category === activeCategory}
              className={`menu-category${category === activeCategory ? " is-active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div
          className="menu-category-content"
          role="group"
          aria-label={activeCategory}
        >
          <h2>{activeCategory}</h2>
        </div>
      </section>
    </>
  );
}
