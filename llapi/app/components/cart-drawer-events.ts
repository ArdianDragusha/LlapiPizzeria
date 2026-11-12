export const OPEN_CART_DRAWER_EVENT = "pizzeria:open-cart-drawer";

export function openCartDrawer() {
  window.dispatchEvent(new Event(OPEN_CART_DRAWER_EVENT));
}
