"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  getCartSnapshot,
  getServerCartSnapshot,
  removeCartItem,
  subscribeToCart,
} from "../components/cart-storage";

function formatPrice(priceInCents: number) {
  return `€${(priceInCents / 100).toFixed(2)}`;
}

export default function CartPage() {
  const cart = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const [actionError, setActionError] = useState("");
  const items = cart.items;

  function handleRemove(itemId: string) {
    try {
      removeCartItem(itemId);
      setActionError("");
    } catch (removeError) {
      console.error("Could not remove the cart item.", removeError);
      setActionError("We couldn't remove that item. Please try again.");
    }
  }

  const total = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );

  return (
    <main className="cart-page">
      <header className="cart-page-header">
        <h1>Your cart</h1>
        <p>Review your items before checkout.</p>
      </header>

      {(cart.error || actionError) && (
        <p className="cart-message cart-error" role="alert">
          {cart.error || actionError}
        </p>
      )}

      {!cart.error && items.length === 0 ? (
        <section className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Choose something delicious from the menu to get started.</p>
          <Link href="/">Browse menu</Link>
        </section>
      ) : (
        items.length > 0 && (
          <div className="cart-content">
            <section className="cart-items" aria-label="Items in your cart">
              {items.map((item) => (
                <article className="cart-item" key={item.id}>
                  <div className="cart-item-info">
                    <span className="cart-item-category">{item.category}</span>
                    <h2>{item.name}</h2>
                    {item.variant && <p>{item.variant}</p>}
                    {item.description && <p>{item.description}</p>}
                    {item.details?.map((detail) => <p key={detail}>{detail}</p>)}
                  </div>
                  <div className="cart-item-actions">
                    <strong>
                      {formatPrice(item.unitPriceCents * item.quantity)}
                    </strong>
                    <button type="button" onClick={() => handleRemove(item.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="cart-total" aria-label="Cart total">
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
              <p>Delivery fees, if applicable, are calculated at checkout.</p>
              <button type="button" disabled>
                Checkout coming soon
              </button>
            </aside>
          </div>
        )
      )}
    </main>
  );
}
