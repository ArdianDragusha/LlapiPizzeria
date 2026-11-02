export const PIZZA_BUILDER_EVENT = "pizzeria:open-pizza-builder";

export function openPizzaBuilder() {
  window.dispatchEvent(new Event(PIZZA_BUILDER_EVENT));
}
