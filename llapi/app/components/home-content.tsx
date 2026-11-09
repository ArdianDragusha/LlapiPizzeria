"use client";

import { useEffect, useState } from "react";
import { openPizzaBuilder } from "./pizza-builder-events";
import { addCartItem } from "./cart-storage";

const advertisements = ["AD1", "AD2", "AD3"];

type PizzaSize = "normal" | "perhepizza";

type MenuCategory =
  | "Pizzas"
  | "Kebabs"
  | "Grill & meats"
  | "Drinks"
  | "Desserts";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  image: string;
} & (
  | {
      category: "Pizzas";
      price: {
        normal: number;
        perhepizza: number;
      };
    }
  | {
      category: Exclude<MenuCategory, "Pizzas">;
      price: number;
    }
);

// Add menu items here. Prices are in euros. For each pizza, set both sizes and
// keep the Perhepizza price higher than the normal pizza price.
// To use a real image later, put it in /public/menu and set image to
// its path, e.g. "/menu/margherita.jpg". Leave it empty for the placeholder.
const menuItems: MenuItem[] = [
  {
    id: "margherita",
    category: "Pizzas",
    name: "Margherita",
    description: "Tomato sauce, mozzarella, fresh basil.",
    image: "",
    price: { normal: 9.9, perhepizza: 16.9 },
  },
  {
    id: "pepperoni",
    category: "Pizzas",
    name: "Pepperoni",
    description: "Tomato sauce, mozzarella, pepperoni.",
    image: "",
    price: { normal: 11.9, perhepizza: 19.9 },
  },
  {
    id: "veggie-garden",
    category: "Pizzas",
    name: "Veggie garden",
    description: "Bell pepper, mushrooms, red onion, olives, mozzarella.",
    image: "",
    price: { normal: 10.9, perhepizza: 18.9 },
  },
  {
    id: "chicken-kebab",
    category: "Kebabs",
    name: "Chicken kebab",
    description: "Chicken kebab, salad, and house sauce.",
    image: "",
    price: 12.5,
  },
  {
    id: "kebab-plate",
    category: "Kebabs",
    name: "Kebab plate",
    description: "Kebab, fries, fresh salad, and garlic sauce.",
    image: "",
    price: 13.9,
  },
  {
    id: "grilled-chicken",
    category: "Grill & meats",
    name: "Grilled chicken",
    description: "Grilled chicken with seasoned fries and salad.",
    image: "",
    price: 14.9,
  },
  {
    id: "mixed-grill",
    category: "Grill & meats",
    name: "Mixed grill",
    description: "A selection of grilled meats with fries and salad.",
    image: "",
    price: 17.9,
  },
  {
    id: "cola",
    category: "Drinks",
    name: "Cola",
    description: "Chilled, 0.33 l.",
    image: "",
    price: 2.5,
  },
  {
    id: "sparkling-water",
    category: "Drinks",
    name: "Sparkling water",
    description: "Refreshing sparkling water, 0.5 l.",
    image: "",
    price: 2.0,
  },
];

// Add new menu categories to this list.
const menuCategories: MenuCategory[] = [
  "Pizzas",
  "Kebabs",
  "Grill & meats",
  "Drinks",
];

export default function HomeContent() {
  const [activeAdvertisement, setActiveAdvertisement] = useState(0);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>(menuCategories[0]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedPizzaSizes, setSelectedPizzaSizes] = useState<
    Record<string, PizzaSize>
  >({});
  const [cartFeedback, setCartFeedback] = useState<Record<string, string>>({});

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

  function formatPrice(price: number) {
    return `€${price.toFixed(2)}`;
  }

  function addMenuItemToCart(item: MenuItem) {
    const isPizza = item.category === "Pizzas";
    const selectedSize = selectedPizzaSizes[item.id] ?? "normal";
    const unitPrice = isPizza ? item.price[selectedSize] : item.price;

    try {
      addCartItem({
        name: item.name,
        category: item.category,
        description: item.description,
        variant: isPizza
          ? selectedSize === "normal"
            ? "Normal pizza"
            : "Perhepizza"
          : undefined,
        unitPriceCents: Math.round(unitPrice * 100),
      });
      setCartFeedback((current) => ({ ...current, [item.id]: "Added to cart." }));
    } catch (error) {
      console.error("Could not add the menu item to the cart.", error);
      setCartFeedback((current) => ({
        ...current,
        [item.id]: "Couldn't add to cart. Please try again.",
      }));
    }
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
                key={`advertisement-${index}`}
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
          {activeCategory === "Pizzas" && (
            <article className="build-pizza-card">
              <div>
                <span className="build-pizza-eyebrow">Made your way</span>
                <h3>Build your own pizza</h3>
                <p>Choose your size, crust, sauce, and favourite toppings.</p>
              </div>
              <button type="button" onClick={openPizzaBuilder}>
                Start building
              </button>
            </article>
          )}

          <div className="menu-item-grid">
            {menuItems
              .filter((item) => item.category === activeCategory)
              .map((item) => {
                const isPizza = item.category === "Pizzas";
                const selectedSize = selectedPizzaSizes[item.id] ?? "normal";

                return (
                  <article className="menu-item-card" key={item.id}>
                    {item.image ? (
                      // Replace the empty image value in menuItems to display an image.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="menu-item-image" src={item.image} alt={item.name} />
                    ) : (
                      <div
                        className="menu-item-image menu-item-image-placeholder"
                        role="img"
                        aria-label={`Image placeholder for ${item.name}`}
                      >
                        <span aria-hidden="true">Image placeholder</span>
                      </div>
                    )}
                    <div className="menu-item-details">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      {isPizza ? (
                        <div
                          className="menu-pizza-sizes"
                          aria-label={`${item.name} pizza size and price`}
                        >
                          {(["normal", "perhepizza"] as const).map((size) => (
                            <button
                              key={size}
                              type="button"
                              aria-pressed={selectedSize === size}
                              className={`menu-pizza-size${selectedSize === size ? " is-selected" : ""}`}
                              onClick={() =>
                                setSelectedPizzaSizes((current) => ({
                                  ...current,
                                  [item.id]: size,
                                }))
                              }
                            >
                              <span>
                                {size === "normal" ? "Normal pizza" : "Perhepizza"}
                              </span>
                              <strong>
                                {formatPrice(item.price[size])}
                              </strong>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <strong className="menu-item-price">
                          {formatPrice(item.price)}
                        </strong>
                      )}
                      <button
                        className="menu-item-add"
                        type="button"
                        onClick={() => addMenuItemToCart(item)}
                      >
                        Add to cart ·{" "}
                        {formatPrice(
                          isPizza ? item.price[selectedSize] : item.price,
                        )}
                      </button>
                      <p className="menu-item-cart-feedback" aria-live="polite">
                        {cartFeedback[item.id] ?? ""}
                      </p>
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      </section>
    </>
  );
}
