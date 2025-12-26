# zyX-Conditional Development TO-DO

## Planned Improvements
- Provide helpers for composing common conditional predicates (e.g., `allTruthy`,
  `anyTruthy`) to simplify template authoring.
- Surface debugging hooks from `ConditionalGroup` so tooling can inspect which
  branch is currently active.
- Add SSR-safe fallbacks so condition evaluation can run outside the browser.

## Known Issues
- Inline `or` predicates cannot currently short-circuit async reactives; track a
  promise-aware variant.
- There is no built-in instrumentation for counting how often branches switch,
  which complicates performance analysis.

## Development Priorities
1. Expand unit tests to cover multi-reactive predicates and inline `or`
   combinations.
2. Document error-handling expectations for user-provided predicate functions.
3. Investigate exposing a `teardown` hook so subscriptions can unregister when
   elements are removed manually.

