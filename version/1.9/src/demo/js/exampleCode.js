import { html, dynamicVar } from "zyX";

// Create a reactive variable
const count = dynamicVar(0);

// Create a component with template binding
class Counter {
  constructor() {
    // Template with reactive variables and event binding
    html`
      <div class="counter">
        <h2 this="title">Counter Example</h2>
        <p>Current count: ${count}</p>
        <button zyx-click=${() => count.set(count.value + 1)}>Increment</button>
        <button zyx-click=${() => count.set(0)}>Reset</button>
      </div>
    `
      .bind(this) // Bind template to any class instance
  }
}

class App {
  constructor() {
    html`
      <div id="app">
        <h1>Hello World</h1>
        ${new Counter()} 
      </div>
    `
      .logMap() // Log everything that is mounted
      .bind(this)
      .place("app"); // Mounted in place of `<ph app></ph>`
  }
}

const app = new App();
window..app = app;