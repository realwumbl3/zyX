import { html, dynamicVar } from "../..";

// Create a dynamic value with an initial value of 69 boats
const boats = dynamicVar(69);

// Create HTML with dynamic values in both attributes and content
const template = html`
  <div class="boat-container">
    <h1 how-many-boats=${boats}>
      i have ${boats} boats.
    </h1>
    <div zyx-click=${() => boats.set(boats.value + 1)} class="buy-button">BUY MORE BOAT</div>
    <div zyx-click=${() => boats.set(boats.value + 100)} class="buy-button">BUY 100 BOATS</div>
    <div zyx-click=${() => boats.set(boats.value + 1000)} class="buy-button">BUY 1000 BOATS</div>

    <div class="boat-controls">
      <button zyx-click=${() => boats.set(boats.value - 10)}>Sell 10 Boats</button>
      <button zyx-click=${() => boats.set(boats.value - 1)}>Sell 1 Boat</button>
      <button zyx-click=${() => boats.set(0)}>Sell All Boats</button>
    </div>
  </div>
`;

// Append the template to the document body
document.addEventListener("DOMContentLoaded", () => {
  template.place(document.body);
});
