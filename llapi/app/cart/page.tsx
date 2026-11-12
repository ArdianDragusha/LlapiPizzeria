"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import {
  getCartSnapshot,
  getServerCartSnapshot,
  removeCartItem,
  subscribeToCart,
  updateCartItemQuantity,
} from "../components/cart-storage";

function formatPrice(priceInCents: number) {
  return `€${(priceInCents / 100).toFixed(2)}`;
}

// Keep this threshold aligned with the real free-delivery policy before launch.
const FREE_DELIVERY_THRESHOLD_CENTS = 2000;

export default function CartPage({
  drawer = false,
  onClose,
}: {
  drawer?: boolean;
  onClose?: () => void;
}) {
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

  function handleQuantityChange(itemId: string, quantity: number) {
    try {
      updateCartItemQuantity(itemId, quantity);
      setActionError("");
    } catch (quantityError) {
      console.error("Could not update the cart item quantity.", quantityError);
      setActionError("We couldn't update that quantity. Please try again.");
    }
  }

  const total = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );

  const content = (
    <>
      <header className="cart-page-header">
        <div>
          <h1 id={drawer ? "cart-drawer-title" : undefined}>Your order</h1>
          {!drawer && <p>Review your items before checkout.</p>}
        </div>
        {drawer && (
          <button
            aria-label="Close cart"
            className="cart-drawer-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        )}
        {drawer && (
          <nav aria-label="Checkout progress" className="cart-drawer-progress">
            {["Cart", "Order type", "Details", "Payment"].map((step, index) => (
              <div
                aria-current={index === 0 ? "step" : undefined}
                className={index === 0 ? "is-active" : ""}
                key={step}
              >
                <span />
                <p>{step}</p>
              </div>
            ))}
          </nav>
        )}
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
          <Link href="/" onClick={onClose}>Browse menu</Link>
        </section>
      ) : (
        items.length > 0 && (
          <div className="cart-content">
            <section className="cart-items" aria-label="Items in your cart">
              {items.map((item) => (
                <article className="cart-item" key={item.id}>
                  <div className="cart-item-main">
                    {drawer && (
                      <div aria-hidden="true" className="cart-item-placeholder">
                        {item.name.slice(0, 1)}
                      </div>
                    )}
                    <div className="cart-item-info">
                      <span className="cart-item-category">{item.category}</span>
                      <h2>{item.name}</h2>
                      {item.variant && <p>{item.variant}</p>}
                      {item.description && <p>{item.description}</p>}
                      {item.details?.map((detail) => <p key={detail}>{detail}</p>)}
                    </div>
                  </div>
                  <div className="cart-item-actions">
                    <strong>
                      {formatPrice(item.unitPriceCents * item.quantity)}
                    </strong>
                    <div className="cart-quantity-control" aria-label={`Quantity for ${item.name}`}>
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${item.name} quantity`}
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button type="button" onClick={() => handleRemove(item.id)}>
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="cart-total" aria-label="Cart total">
              {drawer && (
                <div className="cart-free-delivery">
                  <p>
                    {total >= FREE_DELIVERY_THRESHOLD_CENTS
                      ? "Your order qualifies for free delivery"
                      : `Add ${formatPrice(FREE_DELIVERY_THRESHOLD_CENTS - total)} more for free delivery`}
                  </p>
                  <div
                    aria-label={`${Math.min(100, Math.round((total / FREE_DELIVERY_THRESHOLD_CENTS) * 100))}% toward free delivery`}
                    className="cart-free-delivery-track"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={FREE_DELIVERY_THRESHOLD_CENTS}
                    aria-valuenow={Math.min(total, FREE_DELIVERY_THRESHOLD_CENTS)}
                  >
                    <span
                      style={{
                        width: `${Math.min(100, (total / FREE_DELIVERY_THRESHOLD_CENTS) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <span className={drawer ? "cart-subtotal-label" : undefined}>
                Subtotal
              </span>
              <strong className={drawer ? "cart-subtotal-price" : undefined}>
                {formatPrice(total)}
              </strong>
              {drawer && (
                <>
                  <span className="cart-delivery-label">Delivery</span>
                  <span className="cart-delivery-value">Calculated at checkout</span>
                </>
              )}
              <span className={drawer ? "cart-grand-total-label" : undefined}>
                Total
              </span>
              <strong className={drawer ? "cart-grand-total-price" : undefined}>
                {formatPrice(total)}
              </strong>
              {!drawer && (
                <p>Delivery fees, if applicable, are calculated at checkout.</p>
              )}
              <Link
                className="cart-checkout-link"
                href="/checkout"
                onClick={onClose}
              >
                Go to checkout
              </Link>
            </aside>
          </div>
        )
      )}
    </>
  );

  if (drawer) {
    return (
      <div className="cart-drawer-overlay">
        <button
          aria-label="Close cart"
          className="cart-drawer-backdrop"
          onClick={onClose}
          type="button"
        />
        <main
          aria-labelledby="cart-drawer-title"
          aria-modal="true"
          className="cart-page cart-drawer"
          role="dialog"
        >
          {content}
        </main>
      </div>
    );
  }

  return <main className="cart-page">{content}</main>;
}
