// # JavaScript Design Style (Concise)
// ## Modules & Structure
// -   ES modules only. One default class per component file; helpers as named exports.
// -   Suggested layout: `components/` (UI classes), `dep/` (third-party), `utils.js` (helpers), `state.js` (reactive store singleton), `socket.js` (connection manager).
// -   No globals. Use singletons sparingly for app-wide state and connection.

// Imports
import { html, css, LiveVar, LiveList } from "./dep/zyx.js";

// ## Naming
// -   Classes: PascalCase (AppRoot, SocketManager, IconList, ItemsPanel)
// -   Functions/vars: camelCase (ensureSocket, applyToken, toggleVisible)
// -   Constants: UPPER_SNAKE_CASE

// ## zyx — Templating, Styles, Reactivity
// -   Templates via `html` and attach with `.bind(this)` to set handler `this`.
// -   Styles via `css` at module top if needed.
// -   Reactivity: `LiveVar`, `LiveList` expose `.get()` and `.set(newValue)`.
// -   Use `.interp(fn)` inside templates for reactive text/attrs/subtrees.
// -   Directives used here: `zyx-click`, `zyx-if`, and `zyx-live-list`.
// -   `this` is used to bind the instance to the template. (id can also be used to bind to a specific element)

css`
    @import url(${chrome.runtime.getURL("app/styles.css")});
`;

export class Pill {
    constructor() {
        html`
            <div id="pill" this="pill">
                <span zyx-click=${(e) => this.onClick(e)}>Label: ${state.label.interp((v) => v || "")}</span>
            </div>
        `.bind(this);
    }
    onClick(e) {
        this.pill.classList.toggle("active");
        /* ... */
    }
}

// ## State

// -   Central reactive store with `LiveVar/LiveList`. Read via `.interp` in views; update via `.set()` in actions.

// state.js
class AppState {
    constructor() {
        this.label = new LiveVar("");
        this.items = new LiveList([]);
        this.visible = new LiveVar(true);
    }
}
const state = new AppState();

// ## zyx LiveList + `zyx-live-list`

// -   LiveList stores arrays of model instances.
// -   Render lists declaratively with `zyx-live-list`, which composes each item via a view class.
// -   Use `zyx-if` to hide empty lists and `.interp(v => v.length)` for counts.

// ```js
// Model (item)
export class ItemModel {
    constructor(data) {
        this.id = data.id;
        this.name = new LiveVar(data.name || "");
        this.imageUrl = new LiveVar(data.imageUrl || "");
    }
}

// View (per item)
export class ItemView {
    constructor(model) {
        this.model = model;
        html`<div class="item">
            <img
                this="my_image"
                alt=${this.model.name.interp((v) => v || "")}
                title=${this.model.name.interp((v) => v || "")}
                src=${this.model.imageUrl.interp((v) => v || "")}
            />
            <span zyx-click=${() => this.onClick(e)}>${this.model.name.interp((v) => v)}</span>
            <span>${state.items.interp((v) => v.length)} items in the list</span>
        </div>`.bind(this);
    }
    onClick(e) {
        console.log("onClick", e, e.my_image, e.clientX, e.clientY);
        this.my_image.classList.toggle("active");
        // you can also access the view's top element with this.main
        this.main.classList.toggle("active");
    }
}

// Container rendering the list
export class ItemsPanel {
    constructor() {
        html`
            <div
                class="items"
                zyx-if=${[state.items, (v) => v.length > 0]}
                zyx-live-list=${{ list: state.items, compose: ItemView }}
            ></div>
            <span>Total: ${state.items.interp((v) => v.length)}</span>
        `.bind(this);
    }
}
