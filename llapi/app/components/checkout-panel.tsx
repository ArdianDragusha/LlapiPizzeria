"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  getCartSnapshot,
  getServerCartSnapshot,
  removeCartItem,
  subscribeToCart,
  updateCartItemQuantity,
} from "./cart-storage";

type OrderType = "Delivery" | "Pickup" | "Dine-in";
type TimeChoice = "asap" | "scheduled";
type ScheduleDay = "today" | "tomorrow";
type DeliveryZone = {
  maxDistanceKm: number;
  feeCents: number;
  minimumOrderCents: number;
};
type Coordinates = { latitude: number; longitude: number };

// Replace these sample coordinates with the restaurant's exact map pin.
const RESTAURANT_LOCATION: Coordinates = {
  latitude: 60.2934,
  longitude: 25.0378,
};

// Keep delivery pricing and minimum orders in sync with the restaurant's real zones.
const DELIVERY_ZONES: DeliveryZone[] = [
  { maxDistanceKm: 3, feeCents: 290, minimumOrderCents: 1000 },
  { maxDistanceKm: 6, feeCents: 490, minimumOrderCents: 1200 },
  { maxDistanceKm: 10, feeCents: 690, minimumOrderCents: 1500 },
];

const ORDER_STEPS = ["Cart", "Order type", "Details", "Payment"];
const PAYMENT_METHODS = [
  {
    id: "card",
    name: "Card",
    description: "Visa, Mastercard",
  },
  {
    id: "mobilepay",
    name: "MobilePay",
    description: "Pay with your phone",
  },
  {
    id: "wallet",
    name: "Apple Pay / Google Pay",
    description: "One-tap wallet payment",
  },
  {
    id: "driver",
    name: "Pay the driver",
    description: "Card terminal on delivery",
  },
] as const;

function formatPrice(priceInCents: number) {
  return `€${(priceInCents / 100).toFixed(2)}`;
}

function getSlotValue(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDistanceKm(from: Coordinates, to: Coordinates) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDifference = toRadians(to.latitude - from.latitude);
  const longitudeDifference = toRadians(to.longitude - from.longitude);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function createTimeSlots(day: ScheduleDay, anchor: Date) {
  const start = new Date(anchor);

  if (day === "tomorrow") {
    start.setDate(start.getDate() + 1);
    // Sample opening time; update this to match the restaurant's actual hours.
    start.setHours(10, 30, 0, 0);
  } else {
    start.setMinutes(Math.ceil(start.getMinutes() / 15) * 15, 0, 0);
    if (start <= anchor) {
      start.setMinutes(start.getMinutes() + 15);
    }
  }

  const end = new Date(start);
  end.setHours(22, 0, 0, 0);
  const slots: Date[] = [];

  while (start <= end) {
    slots.push(new Date(start));
    start.setMinutes(start.getMinutes() + 15);
  }

  return slots;
}

export default function CheckoutPanel({ modal = false }: { modal?: boolean }) {
  const router = useRouter();
  const cart = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const [step, setStep] = useState(0);
  const [orderType, setOrderType] = useState<OrderType | null>(null);
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [deliveryCheck, setDeliveryCheck] = useState<{
    distanceKm: number;
    zone: DeliveryZone | null;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [timeChoice, setTimeChoice] = useState<TimeChoice>("asap");
  const [asapTime, setAsapTime] = useState<Date | null>(null);
  const [scheduleDay, setScheduleDay] = useState<ScheduleDay>("today");
  const [scheduleAnchor, setScheduleAnchor] = useState<Date | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [kitchenNotes, setKitchenNotes] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [formError, setFormError] = useState("");
  const deliveryAddressRef = useRef<HTMLTextAreaElement>(null);

  const items = cart.items;
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const deliveryFeeCents =
    orderType === "Delivery" && deliveryCheck?.zone
      ? deliveryCheck.zone.feeCents
      : 0;
  const totalCents = subtotalCents + deliveryFeeCents;
  const deliveryMinimumMet =
    !deliveryCheck?.zone ||
    subtotalCents >= deliveryCheck.zone.minimumOrderCents;
  const scheduledTimeDate =
    scheduledAt && scheduleAnchor ? new Date(scheduleAnchor) : null;
  if (scheduledTimeDate && scheduledAt) {
    if (scheduleDay === "tomorrow") {
      scheduledTimeDate.setDate(scheduledTimeDate.getDate() + 1);
    }
    const [hours, minutes] = scheduledAt.split(":").map(Number);
    scheduledTimeDate.setHours(hours, minutes, 0, 0);
  }
  const formattedScheduledTime = scheduledTimeDate
    ? `${formatDate(scheduledTimeDate)} at ${formatClock(scheduledTimeDate)}`
    : null;
  const timeSummary =
    timeChoice === "asap"
      ? asapTime
        ? `ASAP (about 45 min, around ${formatClock(asapTime)})`
        : "As soon as possible"
      : formattedScheduledTime ?? "Choose a scheduled time";

  function changeQuantity(itemId: string, quantity: number) {
    try {
      updateCartItemQuantity(itemId, quantity);
      setFormError("");
    } catch (error) {
      console.error("Could not update checkout cart quantity.", error);
      setFormError("We couldn't update that quantity. Please try again.");
    }
  }

  function removeItem(itemId: string) {
    try {
      removeCartItem(itemId);
      setFormError("");
    } catch (error) {
      console.error("Could not remove checkout cart item.", error);
      setFormError("We couldn't remove that item. Please try again.");
    }
  }

  function checkDelivery() {
    if (!address.trim()) {
      setDeliveryMessage("Enter the delivery address before checking it.");
      return;
    }

    if (!coordinates) {
      setDeliveryMessage(
        "Use your current location to check an estimated delivery distance. Address-based road routing can be connected when a map service is configured.",
      );
      return;
    }

    const distanceKm = getDistanceKm(RESTAURANT_LOCATION, coordinates);
    const zone =
      DELIVERY_ZONES.find((candidate) => distanceKm <= candidate.maxDistanceKm) ??
      null;
    setDeliveryCheck({ distanceKm, zone });

    if (zone) {
      setDeliveryMessage(
        `${distanceKm.toFixed(1)} km approximate straight-line distance · delivery ${formatPrice(zone.feeCents)} · minimum order ${formatPrice(zone.minimumOrderCents)}.`,
      );
    } else {
      setDeliveryMessage(
        `${distanceKm.toFixed(1)} km approximate straight-line distance. We deliver within 10 km; choose pickup or dine-in, or change the address.`,
      );
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setDeliveryMessage("This browser does not support location access.");
      return;
    }

    setLocationLoading(true);
    setDeliveryMessage("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setDeliveryMessage(
          "Location saved on this device. Check the estimated fee now; select your location again if you edit the address.",
        );
        setLocationLoading(false);
      },
      (error) => {
        console.error("Could not access the current location.", error);
        setDeliveryMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location permission was denied. Enter your address and allow location access to check the delivery distance."
            : "We couldn't get your location. Please try again or choose pickup or dine-in.",
        );
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function selectTimeChoice(choice: TimeChoice) {
    setTimeChoice(choice);
    if (choice === "asap") {
      setAsapTime(new Date(Date.now() + 45 * 60 * 1000));
      setScheduledAt(null);
    } else {
      const now = new Date();
      setScheduleAnchor(now);
      setScheduleDay("today");
      setScheduledAt(null);
    }
  }

  function continueToNextStep() {
    setFormError("");

    if (step === 0) {
      if (items.length === 0) {
        setFormError("Add at least one item to your cart before continuing.");
        return;
      }
      setStep(1);
      setAsapTime(new Date(Date.now() + 45 * 60 * 1000));
      return;
    }

    if (step === 1) {
      if (!orderType) {
        setFormError("Choose delivery, pickup, or dine-in to continue.");
        return;
      }
      if (
        orderType === "Delivery" &&
        (!address.trim() || !deliveryCheck?.zone || !deliveryMinimumMet)
      ) {
        setFormError(
          deliveryCheck?.zone && !deliveryMinimumMet
            ? `The minimum order for this delivery zone is ${formatPrice(deliveryCheck.zone.minimumOrderCents)}.`
            : "Enter an address and check that it is within the delivery area.",
        );
        return;
      }
      if (timeChoice === "scheduled" && !scheduledAt) {
        setFormError("Choose an available scheduled time to continue.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!fullName.trim() || !phone.trim()) {
        setFormError("Enter your full name and phone number to continue.");
        return;
      }
      setStep(3);
    }
  }

  function chooseScheduleDay(day: ScheduleDay) {
    setScheduleDay(day);
    setScheduledAt(null);
  }

  const availableSlots = scheduleAnchor
    ? createTimeSlots(scheduleDay, scheduleAnchor)
    : [];
  const canContinue =
    step === 0
      ? items.length > 0
      : step === 1
        ? Boolean(
            orderType &&
              (orderType !== "Delivery" ||
                (address.trim() &&
                  deliveryCheck?.zone &&
                  deliveryMinimumMet)) &&
              (timeChoice === "asap" || scheduledAt),
          )
        : step === 2
          ? Boolean(fullName.trim() && phone.trim())
          : false;

  return (
    <div className="checkout-overlay">
      {modal ? (
        <button
          aria-label="Close checkout and return to cart"
          className="checkout-backdrop"
          onClick={() => router.back()}
          type="button"
        />
      ) : (
        <Link
          aria-label="Return to cart"
          className="checkout-backdrop"
          href="/cart"
        />
      )}
      <section
        aria-labelledby="checkout-title"
        aria-modal="true"
        className="checkout-panel"
        role="dialog"
      >
        <header className="checkout-header">
          <div className="checkout-title-row">
            <h1 id="checkout-title">Your order</h1>
            {modal ? (
              <button
                aria-label="Close checkout"
                className="checkout-close"
                onClick={() => router.back()}
                type="button"
              >
                ×
              </button>
            ) : (
              <Link
                aria-label="Return to cart"
                className="checkout-close"
                href="/cart"
              >
                ×
              </Link>
            )}
          </div>
          <nav aria-label="Checkout progress" className="checkout-progress">
            {ORDER_STEPS.map((label, index) => (
              <div
                aria-current={index === step ? "step" : undefined}
                className={`checkout-progress-step${index <= step ? " is-active" : ""}`}
                key={label}
              >
                <span />
                <p>{label}</p>
              </div>
            ))}
          </nav>
        </header>

        <div className="checkout-body">
          {(cart.error || formError) && (
            <p className="checkout-error" role="alert">
              {cart.error || formError}
            </p>
          )}

          {step === 0 && (
            <section aria-label="Order items" className="checkout-section">
              {items.length === 0 ? (
                <div className="checkout-empty">
                  <h2>Your cart is empty</h2>
                  <p>Add something from the menu before checking out.</p>
                  <Link href="/">Browse menu</Link>
                </div>
              ) : (
                items.map((item) => (
                  <article className="checkout-cart-item" key={item.id}>
                    <div className="checkout-item-main">
                      <div className="checkout-item-placeholder" aria-hidden="true">
                        {item.name.slice(0, 1)}
                      </div>
                      <div className="checkout-item-text">
                        <span>{item.category}</span>
                        <h2>{item.name}</h2>
                        {item.variant && <p>{item.variant}</p>}
                        {item.description && <p>{item.description}</p>}
                        {item.details?.map((detail) => (
                          <p key={detail}>{detail}</p>
                        ))}
                        <div
                          aria-label={`Quantity for ${item.name}`}
                          className="checkout-quantity"
                        >
                          <button
                            aria-label={`Decrease ${item.name} quantity`}
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              changeQuantity(item.id, item.quantity - 1)
                            }
                            type="button"
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            aria-label={`Increase ${item.name} quantity`}
                            onClick={() =>
                              changeQuantity(item.id, item.quantity + 1)
                            }
                            type="button"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="checkout-item-actions">
                      <strong>
                        {formatPrice(item.unitPriceCents * item.quantity)}
                      </strong>
                      <button
                        aria-label={`Remove ${item.name} from your order`}
                        onClick={() => removeItem(item.id)}
                        type="button"
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          )}

          {step === 1 && (
            <section aria-label="Order type and time" className="checkout-section">
              <h2>Order type</h2>
              <div className="checkout-choice-grid">
                {(["Delivery", "Pickup", "Dine-in"] as const).map((choice) => (
                  <button
                    aria-pressed={orderType === choice}
                    className={`checkout-choice${orderType === choice ? " is-selected" : ""}`}
                    key={choice}
                    onClick={() => {
                      setOrderType(choice);
                      setFormError("");
                    }}
                    type="button"
                  >
                    <strong>{choice}</strong>
                    <span>
                      {choice === "Delivery"
                        ? "Within 10 km"
                        : choice === "Pickup"
                          ? "Collect your order"
                          : "Eat at the restaurant"}
                    </span>
                  </button>
                ))}
              </div>

              {orderType === "Delivery" && (
                <div className="checkout-delivery">
                  <label htmlFor="delivery-address">Delivery address</label>
                  <textarea
                    autoComplete="street-address"
                    id="delivery-address"
                    ref={deliveryAddressRef}
                    onChange={(event) => {
                      setAddress(event.target.value);
                      setCoordinates(null);
                      setDeliveryCheck(null);
                      setDeliveryMessage("");
                    }}
                    placeholder="Street address, postal code, city"
                    rows={2}
                    value={address}
                  />
                  <button
                    className="checkout-location-button"
                    disabled={locationLoading}
                    onClick={useCurrentLocation}
                    type="button"
                  >
                    {locationLoading ? "Getting your location…" : "Use my current location"}
                  </button>
                  <button
                    className="checkout-secondary-button"
                    onClick={checkDelivery}
                    type="button"
                  >
                    Check delivery fee
                  </button>
                  {deliveryMessage && (
                    <p
                      className={`checkout-delivery-result${deliveryCheck?.zone ? " is-covered" : deliveryCheck ? " is-outside" : ""}`}
                      role="status"
                    >
                      {deliveryMessage}
                    </p>
                  )}
                  {deliveryCheck && !deliveryCheck.zone && (
                    <div className="checkout-outside-actions">
                      <p>Choose another order type or change your address.</p>
                      <button
                        onClick={() => {
                          setCoordinates(null);
                          setDeliveryCheck(null);
                          setDeliveryMessage("");
                          deliveryAddressRef.current?.focus();
                        }}
                        type="button"
                      >
                        Change address
                      </button>
                      <button
                        onClick={() => {
                          setOrderType("Pickup");
                          setDeliveryCheck(null);
                        }}
                        type="button"
                      >
                        Switch to pickup
                      </button>
                      <button
                        onClick={() => {
                          setOrderType("Dine-in");
                          setDeliveryCheck(null);
                        }}
                        type="button"
                      >
                        Switch to dine-in
                      </button>
                    </div>
                  )}
                  {deliveryCheck?.zone && !deliveryMinimumMet && (
                    <p className="checkout-error">
                      This zone has a minimum order of{" "}
                      {formatPrice(deliveryCheck.zone.minimumOrderCents)}.
                    </p>
                  )}
                  <p className="checkout-location-note">
                    The estimate uses your device location and straight-line distance.
                    Your location is not sent to a mapping service.
                  </p>
                  <div
                    aria-label="Delivery fees"
                    className="checkout-delivery-zones"
                  >
                    <span>Delivery fees</span>
                    <div>
                      {DELIVERY_ZONES.map((zone, index) => {
                        const minimumDistance = index === 0 ? 0 : DELIVERY_ZONES[index - 1].maxDistanceKm;
                        const active = deliveryCheck?.zone === zone;
                        return (
                          <article
                            className={active ? "is-selected" : ""}
                            key={zone.maxDistanceKm}
                          >
                            <span>
                              {minimumDistance}–{zone.maxDistanceKm} km
                            </span>
                            <strong>{formatPrice(zone.feeCents)}</strong>
                            <small>
                              min {formatPrice(zone.minimumOrderCents)}
                            </small>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="checkout-time-section">
                <h2>When?</h2>
                <div className="checkout-time-options">
                  <button
                    aria-pressed={timeChoice === "asap"}
                    className={`checkout-choice${timeChoice === "asap" ? " is-selected" : ""}`}
                    onClick={() => selectTimeChoice("asap")}
                    type="button"
                  >
                    <strong>As soon as possible</strong>
                    <span>
                      About 45 min
                      {asapTime ? ` · around ${formatClock(asapTime)}` : ""}
                    </span>
                  </button>
                  <button
                    aria-pressed={timeChoice === "scheduled"}
                    className={`checkout-choice${timeChoice === "scheduled" ? " is-selected" : ""}`}
                    onClick={() => selectTimeChoice("scheduled")}
                    type="button"
                  >
                    <strong>Schedule a time</strong>
                    <span>Choose a 15-minute slot</span>
                  </button>
                </div>
                {timeChoice === "scheduled" && scheduleAnchor && (
                  <div className="checkout-schedule">
                    <div aria-label="Choose day" className="checkout-day-options">
                      {(["today", "tomorrow"] as const).map((day) => (
                        <button
                          aria-pressed={scheduleDay === day}
                          key={day}
                          onClick={() => chooseScheduleDay(day)}
                          type="button"
                        >
                          {day === "today" ? "Today" : "Tomorrow"}
                        </button>
                      ))}
                    </div>
                    <label htmlFor="scheduled-time">
                      {scheduleDay === "today"
                        ? "Available times today"
                        : `Available times tomorrow (${formatDate(
                            new Date(
                              scheduleAnchor.getFullYear(),
                              scheduleAnchor.getMonth(),
                              scheduleAnchor.getDate() + 1,
                            ),
                          )})`}
                    </label>
                    <select
                      id="scheduled-time"
                      onChange={(event) => {
                        setScheduledAt(event.target.value || null);
                      }}
                      value={scheduledAt ?? ""}
                    >
                      <option value="">Select a time</option>
                      {availableSlots.map((slot) => (
                        <option key={getSlotValue(slot)} value={getSlotValue(slot)}>
                          {formatClock(slot)}
                        </option>
                      ))}
                    </select>
                    {availableSlots.length === 0 && (
                      <p>No more pickup or delivery slots are available today.</p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 2 && (
            <section aria-label="Customer details" className="checkout-section">
              <h2>Your details</h2>
              <label className="checkout-field" htmlFor="customer-name">
                Full name
                <input
                  autoComplete="name"
                  id="customer-name"
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  value={fullName}
                />
              </label>
              <label className="checkout-field" htmlFor="customer-phone">
                Phone number
                <input
                  autoComplete="tel"
                  id="customer-phone"
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  type="tel"
                  value={phone}
                />
              </label>
              <label className="checkout-field" htmlFor="kitchen-notes">
                Notes for kitchen <span>(Optional)</span>
                <textarea
                  id="kitchen-notes"
                  onChange={(event) => setKitchenNotes(event.target.value)}
                  rows={3}
                  value={kitchenNotes}
                />
              </label>
              <label className="checkout-field" htmlFor="additional-info">
                Additional information
                <span>Door code, allergies, spices</span>
                <textarea
                  id="additional-info"
                  onChange={(event) => setAdditionalInfo(event.target.value)}
                  rows={3}
                  value={additionalInfo}
                />
              </label>
            </section>
          )}

          {step === 3 && (
            <section aria-label="Payment method" className="checkout-section">
              <h2>Order summary</h2>
              <dl className="checkout-summary">
                <div>
                  <dt>Order type</dt>
                  <dd>{orderType ?? "Not selected"}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{timeSummary}</dd>
                </div>
                {orderType === "Delivery" && (
                  <div>
                    <dt>Address</dt>
                    <dd>{address || "Not entered"}</dd>
                  </div>
                )}
                <div>
                  <dt>Customer</dt>
                  <dd>
                    {fullName}
                    <br />
                    {phone}
                  </dd>
                </div>
                {kitchenNotes.trim() && (
                  <div>
                    <dt>Kitchen notes</dt>
                    <dd>{kitchenNotes}</dd>
                  </div>
                )}
                {additionalInfo.trim() && (
                  <div>
                    <dt>Additional information</dt>
                    <dd>{additionalInfo}</dd>
                  </div>
                )}
              </dl>

              <h2>Payment method</h2>
              <p className="checkout-payment-note">
                Choose a preferred method. Payment is not collected on this demo checkout.
              </p>
              <div className="checkout-payment-options">
                {PAYMENT_METHODS.map((method) => {
                  const unavailable =
                    method.id === "driver" && orderType !== "Delivery";
                  return (
                    <label
                      className={`checkout-payment-option${unavailable ? " is-disabled" : ""}`}
                      key={method.id}
                    >
                      <input
                        checked={paymentMethod === method.id}
                        disabled={unavailable}
                        name="payment-method"
                        onChange={() => setPaymentMethod(method.id)}
                        type="radio"
                      />
                      <span>
                        <strong>{method.name}</strong>
                        <small>
                          {unavailable
                            ? "Available for delivery orders"
                            : method.description}
                        </small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <footer className="checkout-footer">
          <div className="checkout-price-line">
            <span>Subtotal</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          {orderType === "Delivery" && step > 0 && (
            <div className="checkout-price-line">
              <span>Delivery fee</span>
              <span>
                {deliveryCheck?.zone
                  ? formatPrice(deliveryFeeCents)
                  : "Check address"}
              </span>
            </div>
          )}
          <div className="checkout-price-line checkout-total-line">
            <strong>Total</strong>
            <strong>{formatPrice(totalCents)}</strong>
          </div>
          {step < 3 ? (
            <button
              className="checkout-primary-button"
              disabled={!canContinue || Boolean(cart.error)}
              onClick={continueToNextStep}
              type="button"
            >
              {step === 0
                ? "Continue to order type"
                : step === 1
                  ? "Continue to details"
                  : "Continue to payment"}
            </button>
          ) : (
            <button className="checkout-primary-button" disabled type="button">
              Online ordering coming soon
            </button>
          )}
          {step > 0 && (
            <button
              className="checkout-back-button"
              onClick={() => {
                setFormError("");
                setStep(step - 1);
              }}
              type="button"
            >
              Back
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
