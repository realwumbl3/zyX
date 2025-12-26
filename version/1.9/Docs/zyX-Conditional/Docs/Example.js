// Example usage of zyX-Conditional helpers

const createSignal = (initialValue) => {
  const listeners = new Set();
  return {
    value: initialValue,
    set(nextValue) {
      this.value = nextValue;
      listeners.forEach((listener) => listener(this.value));
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(this.value);
      return () => listeners.delete(listener);
    },
  };
};

const createLiveList = (initialItems = []) => {
  const listeners = new Set();
  const items = [...initialItems];
  const notify = () => listeners.forEach((listener) => listener(items));
  return {
    get value() {
      return items;
    },
    push(item) {
      items.push(item);
      notify();
    },
    pop() {
      if (!items.length) return;
      items.pop();
      notify();
    },
    clear() {
      if (!items.length) return;
      items.length = 0;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(items);
      return () => listeners.delete(listener);
    },
  };
};

const state = {
  showContinueNextPrompt: createSignal(true),
  nextUpItem: createSignal({ title: "Understanding zyX" }),
  userIsPremium: createSignal(false),
  downloadsReady: createSignal(false),
  userIsAdmin: createSignal(false),
  showQueue: createSignal(true),
  trainingQueue: createLiveList([{ title: "Session 1" }]),
};

let queueId = 1;

const conditionalTemplate = html`
  <section class="playlist-callouts">
    <div
      class="next-up"
      zyx-if=${[
        state.showContinueNextPrompt,
        state.nextUpItem,
        (show, nextUp) => show && Boolean(nextUp),
      ]}
    >
      <strong>Next up:</strong>
      <span>${state.nextUpItem.value?.title ?? "TBD"}</span>
    </div>

    <div zyx-elif=${[state.userIsPremium, (premium) => premium]}>
      <p>Thanks for being a premium member!</p>
    </div>

    <div zyx-else>
      <p>Start learning by adding sessions to your queue.</p>
    </div>

    <button
      class="download"
      zyx-if=${state.downloadsReady}
      or=${[state.userIsAdmin, (isAdmin) => isAdmin]}
    >
      Download current session
    </button>
  </section>
`;

conditionalTemplate.appendTo(document.body);

const liveListDemo = html`
  <section class="live-list-demo">
    <h3>LiveList visibility</h3>
    <div class="controls">
      <button
        zyx-click="${() => {
          queueId += 1;
          state.trainingQueue.push({ title: `Session ${queueId}` });
        }}"
      >
        Add session
      </button>
      <button zyx-click="${() => state.trainingQueue.pop()}">Remove last</button>
      <button zyx-click="${() => state.trainingQueue.clear()}">Clear queue</button>
      <button zyx-click="${() => state.showQueue.set(!state.showQueue.value)}">
        Toggle visibility
      </button>
    </div>

    <div
      zyx-if=${[
        state.showQueue,
        state.trainingQueue,
        (show, queue) => show && queue.length > 0,
      ]}
    >
      <p>The queue is visible and has at least one session.</p>
    </div>
    <div zyx-else>
      <p>The queue is hidden or empty.</p>
    </div>
  </section>
`;

liveListDemo.appendTo(document.body);

// Simulate state changes to demonstrate reactivity
setTimeout(() => {
  state.nextUpItem.set(null);
}, 3000);

setTimeout(() => {
  state.userIsPremium.set(true);
}, 4500);

setTimeout(() => {
  state.downloadsReady.set(false);
  state.userIsAdmin.set(true);
}, 6000);

