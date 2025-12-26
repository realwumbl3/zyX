# zyX-Conditional Module Documentation

The zyX-Conditional utilities power the `zyx-if`, `zyx-elif`, and `zyx-else`
attributes that ship with `zyX-HTML`. They enable declarative control-flow in
templates backed by reactive data sources.

## Core Concepts

1. **Single Reactive Source** – Pass a reactive store or primitive to `zyx-if`.
   The truthiness of the resolved value controls visibility.
2. **Predicate Tuples** – Provide `[reactive, predicate]` to transform the
   reactive value before it is evaluated.
3. **Multi-reactive Predicates** – Provide an array where the final element is a
   predicate. Every preceding entry is treated as a reactive input and its value
   is spread into the predicate.
4. **Inline `or` Attribute** – Apply `or=${...}` on the same element to supply a
   fallback condition that reuses the same evaluation rules.

## Basic Single Reactive Condition

```javascript
html`
  <button zyx-if=${state.showCheckout}>
    Continue to checkout
  </button>
  <button zyx-else>
    Explore the catalog
  </button>
`;
```

`state.showCheckout` can be a primitive boolean or a reactive object that
exposes `.value` and `.subscribe`.

## Predicate Tuples

```javascript
html`
  <li zyx-if=${[state.cartItems, items => items.length > 0]}>
    Items in cart: ${state.cartItems.value.length}
  </li>
  <li zyx-else>
    Your cart is empty
  </li>
`;
```

The predicate receives the resolved value and returns the truthy/falsey result.

## Multi-reactive Conditions

```javascript
html`
  <section
    zyx-if=${[
      state.showContinueNextPrompt,
      state.nextUpItem,
      (show, nextUp) => show && Boolean(nextUp)
    ]}
  >
    <p>Next up: ${state.nextUpItem.value?.title ?? "TBD"}</p>
  </section>
  <section zyx-elif=${[state.userIsPremium, premium => premium]}>
    <p>Thanks for supporting us!</p>
  </section>
  <section zyx-else>
    <p>Discover more content in the feed.</p>
  </section>
`;
```

Every non-function entry before the predicate is treated as an independent
reactive source. Their resolved values are spread into the predicate in order.

## LiveList + Visibility Toggle

```javascript
import { LiveList, LiveVar, html } from "zyx";

const showQueue = new LiveVar(true);
const upcomingSessions = new LiveList([{ title: "Session 1" }]);

html`
  <section
    zyx-if=${[
      showQueue,
      upcomingSessions,
      (show, sessions) => show && sessions.length > 0
    ]}
  >
    <h3>Next session: ${upcomingSessions.value[0].title}</h3>
    <p>Total queued: ${upcomingSessions.value.length}</p>
  </section>
  <section zyx-else>
    <p>The queue is hidden or empty.</p>
  </section>
`;
```

`LiveList` instances expose `.subscribe`, so they behave like any other reactive
source inside conditionals even though they extend `Array`.

## Inline `or` Example

```javascript
html`
  <button
    zyx-if=${downloadIsReady}
    or=${[state.userIsAdmin, admin => admin]}
  >
    Download now
  </button>
`;
```

If `downloadIsReady` resolves to false, the inline `or` predicate is evaluated.
If that predicate returns true, the element is still displayed.

## Backward Compatibility

- Single primitives and `[reactive, predicate]` tuples continue to work without
  modification.
- Inline `or` attributes accept any of the same shapes shown above.
- Only the first matching branch (`zyx-if`/`zyx-elif`) is rendered; the rest are
  hidden automatically.

