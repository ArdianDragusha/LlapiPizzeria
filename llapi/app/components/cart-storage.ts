export const CART_STORAGE_KEY = "llapi-cart";

export type CartItem = {
  id: string;
  name: string;
  category: string;
  variant?: string;
  description?: string;
  details?: string[];
  unitPriceCents: number;
  quantity: number;
};

export type CartSnapshot = {
  items: CartItem[];
  error: string;
};

const CART_UPDATED_EVENT = "pizzeria:cart-updated";
const EMPTY_CART_SNAPSHOT: CartSnapshot = { items: [], error: "" };
let cachedRawCart: string | null | undefined;
let cachedSnapshot = EMPTY_CART_SNAPSHOT;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseCart(rawCart: string | null): CartItem[] {
  if (!rawCart) {
    return [];
  }

  const parsed: unknown = JSON.parse(rawCart);
  if (!Array.isArray(parsed)) {
    throw new Error("Saved cart data is not a list.");
  }

  return parsed.map((item, index) => {
    if (
      isRecord(item) &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      typeof item.category === "string" &&
      typeof item.unitPriceCents === "number" &&
      Number.isFinite(item.unitPriceCents) &&
      typeof item.quantity === "number" &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
    ) {
      return {
        id: item.id,
        name: item.name,
        category: item.category,
        variant: typeof item.variant === "string" ? item.variant : undefined,
        description:
          typeof item.description === "string" ? item.description : undefined,
        details:
          Array.isArray(item.details) &&
          item.details.every((detail) => typeof detail === "string")
            ? item.details
            : undefined,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
      };
    }

    // Keep custom pizzas added by the earlier builder version readable.
    if (
      isRecord(item) &&
      typeof item.name === "string" &&
      typeof item.total === "number"
    ) {
      const details = [
        typeof item.crust === "string" ? `Crust: ${item.crust}` : "",
        typeof item.sauce === "string" ? `Sauce: ${item.sauce}` : "",
        Array.isArray(item.toppings) &&
        item.toppings.every((topping) => typeof topping === "string")
          ? `Toppings: ${item.toppings.join(", ") || "None"}`
          : "",
      ].filter(Boolean);

      return {
        id: `legacy-pizza-${index}`,
        name: item.name,
        category: "Pizzas",
        variant: typeof item.size === "string" ? item.size : undefined,
        details,
        unitPriceCents: item.total,
        quantity: 1,
      };
    }

    throw new Error(`Saved cart item at position ${index + 1} is invalid.`);
  });
}

export function getCartItems(): CartItem[] {
  return parseCart(localStorage.getItem(CART_STORAGE_KEY));
}

export function getCartSnapshot(): CartSnapshot {
  const rawCart = localStorage.getItem(CART_STORAGE_KEY);
  if (rawCart === cachedRawCart) {
    return cachedSnapshot;
  }

  cachedRawCart = rawCart;
  try {
    cachedSnapshot = { items: parseCart(rawCart), error: "" };
  } catch (error) {
    console.error("Could not read the saved cart.", error);
    cachedSnapshot = {
      items: [],
      error: "We couldn't load your cart. Please refresh and try again.",
    };
  }

  return cachedSnapshot;
}

export function getServerCartSnapshot() {
  return EMPTY_CART_SNAPSHOT;
}

export function subscribeToCart(onChange: () => void) {
  function handleStorageChange(event: StorageEvent) {
    if (event.key === CART_STORAGE_KEY || event.key === null) {
      cachedRawCart = undefined;
      onChange();
    }
  }

  function handleCartChange() {
    cachedRawCart = undefined;
    onChange();
  }

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(CART_UPDATED_EVENT, handleCartChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(CART_UPDATED_EVENT, handleCartChange);
  };
}

function saveCartItems(items: CartItem[]) {
  const rawCart = JSON.stringify(items);
  localStorage.setItem(CART_STORAGE_KEY, rawCart);
  cachedRawCart = rawCart;
  cachedSnapshot = { items, error: "" };
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

export function addCartItem(item: Omit<CartItem, "id" | "quantity">) {
  const currentItems = getCartItems();
  const newItem: CartItem = {
    ...item,
    id: crypto.randomUUID(),
    quantity: 1,
  };

  saveCartItems([...currentItems, newItem]);
}

export function removeCartItem(itemId: string): CartItem[] {
  const items = getCartItems().filter((item) => item.id !== itemId);
  saveCartItems(items);
  return items;
}
