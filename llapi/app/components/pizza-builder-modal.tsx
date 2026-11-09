"use client";

import { useEffect, useRef, useState } from "react";
import { PIZZA_BUILDER_EVENT } from "./pizza-builder-events";
import { addCartItem } from "./cart-storage";

type PricedOption = {
  id: string;
  name: string;
  price: number;
};

type ToppingGroup = {
  name: string;
  toppings: PricedOption[];
};

const MAX_TOPPINGS = 3;

// Edit these options and prices (in cents) to change the available pizza sizes.
const sizes: PricedOption[] = [
  { id: "regular", name: "Regular 30 cm", price: 990 },
  { id: "family", name: "Family 40 cm", price: 1590 },
];

// Add, remove, or reprice crust options here. Zero means included in the base price.
const crusts: PricedOption[] = [
  { id: "classic", name: "Classic", price: 0 },
  { id: "thin", name: "Thin", price: 0 },
  { id: "wholegrain", name: "Wholegrain", price: 100 },
  { id: "gluten-free", name: "Gluten-free", price: 250 },
];

// Add, remove, or reprice sauce options here. Zero means included in the base price.
const sauces: PricedOption[] = [
  { id: "tomato", name: "Tomato", price: 0 },
  { id: "garlic-cream", name: "Garlic cream", price: 50 },
  { id: "bbq", name: "BBQ", price: 50 },
  { id: "none", name: "No sauce", price: 0 },
];

// Add, remove, or reprice toppings in these groups. All prices are per topping.
const toppingGroups: ToppingGroup[] = [
  {
    name: "Meat & seafood",
    toppings: [
      { id: "ham", name: "Ham", price: 180 },
      { id: "pepperoni", name: "Pepperoni", price: 180 },
      { id: "salami", name: "Salami", price: 180 },
      { id: "kebab-meat", name: "Kebab meat", price: 200 },
      { id: "chicken", name: "Chicken", price: 200 },
      { id: "beef", name: "Beef", price: 200 },
      { id: "minced-beef", name: "Minced beef", price: 180 },
      { id: "sucuk", name: "Sucuk sausage", price: 200 },
      { id: "tuna", name: "Tuna", price: 180 },
      { id: "shrimp", name: "Shrimp", price: 250 },
    ],
  },
  {
    name: "Vegetables",
    toppings: [
      { id: "onion", name: "Onion", price: 120 },
      { id: "red-onion", name: "Red onion", price: 120 },
      { id: "bell-pepper", name: "Bell pepper", price: 120 },
      { id: "mushrooms", name: "Mushrooms", price: 120 },
      { id: "olives", name: "Olives", price: 120 },
      { id: "jalapeno", name: "Jalapeño", price: 120 },
      { id: "pineapple", name: "Pineapple", price: 120 },
      { id: "tomato", name: "Tomato", price: 120 },
      { id: "garlic", name: "Garlic", price: 80 },
    ],
  },
  {
    name: "Cheese",
    toppings: [
      { id: "feta", name: "Feta", price: 150 },
      { id: "blue-cheese", name: "Blue cheese", price: 150 },
      { id: "kajmak", name: "Kajmak", price: 180 },
      { id: "extra-mozzarella", name: "Extra mozzarella", price: 150 },
    ],
  },
];

function formatPrice(price: number) {
  return `€${(price / 100).toFixed(2)}`;
}

function getOption(options: PricedOption[], id: string) {
  return options.find((option) => option.id === id) ?? options[0];
}

export default function PizzaBuilderModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [sizeId, setSizeId] = useState(sizes[0].id);
  const [crustId, setCrustId] = useState(crusts[0].id);
  const [sauceId, setSauceId] = useState(sauces[0].id);
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    function handleOpen() {
      setIsOpen(true);
    }

    window.addEventListener(PIZZA_BUILDER_EVENT, handleOpen);
    return () => window.removeEventListener(PIZZA_BUILDER_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, [isOpen]);

  const size = getOption(sizes, sizeId);
  const crust = getOption(crusts, crustId);
  const sauce = getOption(sauces, sauceId);
  const toppingOptions = toppingGroups.flatMap((group) => group.toppings);
  const total =
    size.price +
    crust.price +
    sauce.price +
    selectedToppings.reduce(
      (sum, id) => sum + (toppingOptions.find((item) => item.id === id)?.price ?? 0),
      0,
    );

  function toggleTopping(toppingId: string) {
    setFeedback("");
    if (selectedToppings.includes(toppingId)) {
      setSelectedToppings(selectedToppings.filter((id) => id !== toppingId));
      return;
    }

    if (selectedToppings.length >= MAX_TOPPINGS) {
      setFeedback(`Choose up to ${MAX_TOPPINGS} toppings.`);
      return;
    }

    setSelectedToppings([...selectedToppings, toppingId]);
  }

  function addToCart() {
    const toppings = selectedToppings.map(
      (id) => toppingOptions.find((topping) => topping.id === id)?.name ?? id,
    );

    try {
      addCartItem({
        name: "Build your own pizza",
        category: "Pizzas",
        variant: size.name,
        details: [
          `Crust: ${crust.name}`,
          `Sauce: ${sauce.name}`,
          `Toppings: ${toppings.join(", ") || "None"}`,
        ],
        unitPriceCents: total,
      });
      setFeedback("Pizza added to your cart.");
    } catch (error) {
      console.error("Could not save the pizza to the cart.", error);
      setFeedback("We couldn't save your pizza. Please try again.");
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="pizza-builder-dialog"
      aria-labelledby="pizza-builder-title"
      onClose={() => setIsOpen(false)}
    >
      <div className="pizza-builder">
        <header className="pizza-builder-header">
          <h2 id="pizza-builder-title">Build your own pizza</h2>
          <button
            className="pizza-builder-close"
            type="button"
            aria-label="Close pizza builder"
            onClick={() => dialogRef.current?.close()}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="pizza-builder-body">
          <div className="pizza-builder-options">
            <section className="builder-option-section" aria-labelledby="size-title">
              <h3 id="size-title">Size</h3>
              <div className="builder-choice-grid builder-size-grid">
                {sizes.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={sizeId === option.id}
                    className={`builder-choice${sizeId === option.id ? " is-selected" : ""}`}
                    onClick={() => {
                      setSizeId(option.id);
                      setFeedback("");
                    }}
                  >
                    <span>{option.name}</span>
                    <small>{formatPrice(option.price)}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="builder-option-section" aria-labelledby="crust-title">
              <h3 id="crust-title">Crust</h3>
              <div className="builder-choice-grid">
                {crusts.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={crustId === option.id}
                    className={`builder-choice${crustId === option.id ? " is-selected" : ""}`}
                    onClick={() => {
                      setCrustId(option.id);
                      setFeedback("");
                    }}
                  >
                    <span>{option.name}</span>
                    <small>{option.price === 0 ? "Included" : `+${formatPrice(option.price)}`}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="builder-option-section" aria-labelledby="sauce-title">
              <h3 id="sauce-title">Sauce</h3>
              <div className="builder-choice-grid">
                {sauces.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={sauceId === option.id}
                    className={`builder-choice${sauceId === option.id ? " is-selected" : ""}`}
                    onClick={() => {
                      setSauceId(option.id);
                      setFeedback("");
                    }}
                  >
                    <span>{option.name}</span>
                    <small>{option.price === 0 ? "Included" : `+${formatPrice(option.price)}`}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="builder-toppings-section" aria-labelledby="toppings-title">
              <div className="builder-toppings-heading">
                <h3 id="toppings-title">Toppings</h3>
                <span className="builder-topping-count">
                  {selectedToppings.length} of {MAX_TOPPINGS} selected
                </span>
              </div>
              <p className="builder-toppings-note">
                Pick up to {MAX_TOPPINGS}. Mozzarella is included.
              </p>

              {toppingGroups.map((group) => (
                <div className="builder-topping-group" key={group.name}>
                  <h4>{group.name}</h4>
                  <div className="builder-topping-list">
                    {group.toppings.map((topping) => {
                      const selected = selectedToppings.includes(topping.id);
                      return (
                        <button
                          key={topping.id}
                          type="button"
                          aria-pressed={selected}
                          className={`builder-topping${selected ? " is-selected" : ""}`}
                          onClick={() => toggleTopping(topping.id)}
                        >
                          <span aria-hidden="true">{selected ? "−" : "+"}</span>
                          {topping.name}
                          <small>{formatPrice(topping.price)}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          </div>

          <aside className="pizza-builder-summary" aria-label="Pizza order summary">
            <div
              className="pizza-builder-image"
              role="img"
              aria-label="Freshly made pizza with a selection of toppings"
            />
            <h3>Your pizza</h3>
            <dl className="pizza-summary-list">
              <div>
                <dt>{size.name}</dt>
                <dd>{formatPrice(size.price)}</dd>
              </div>
              <div>
                <dt>Crust: {crust.name}</dt>
                <dd>{crust.price === 0 ? "Included" : `+${formatPrice(crust.price)}`}</dd>
              </div>
              <div>
                <dt>Sauce: {sauce.name}</dt>
                <dd>{sauce.price === 0 ? "Included" : `+${formatPrice(sauce.price)}`}</dd>
              </div>
              <div>
                <dt>Mozzarella</dt>
                <dd>Included</dd>
              </div>
              {selectedToppings.map((id) => {
                const topping = toppingOptions.find((option) => option.id === id);
                return topping ? (
                  <div key={id}>
                    <dt>{topping.name}</dt>
                    <dd>+{formatPrice(topping.price)}</dd>
                  </div>
                ) : null;
              })}
            </dl>
            <div className="pizza-builder-total">
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            <button className="pizza-builder-add" type="button" onClick={addToCart}>
              Add to cart · {formatPrice(total)}
            </button>
            <p className="pizza-builder-feedback" aria-live="polite">
              {feedback}
            </p>
          </aside>
        </div>
      </div>
    </dialog>
  );
}
