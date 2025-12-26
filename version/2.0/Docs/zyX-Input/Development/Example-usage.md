# zyX-Input Module Usage Examples

The `zyX-Input` module provides a comprehensive input handling system for web applications, managing keyboard, mouse/touch, and controller inputs.

## Basic Setup

```javascript
import { ZyXInput } from "zyX";

// Create a new input handler instance
const input = new ZyXInput({
  // Optional custom query function
  customQueryFunc: (selector) => document.querySelectorAll(selector),
  // Optional custom selection clearing function
  customClearSelections: () => window.getSelection().removeAllRanges(),
  // Optional global key press callback
  onKeyPress: (event) => console.log("Key pressed:", event.key),
});
```

## Click Events

### Single Click

```javascript
input.on(element).clickOne({
  onClick: () => {
    // Handle single click
    console.log("Clicked once");
  },
});
```

### Click or Double Click

```javascript
input.on(element).clickOrTwo({
  single: (event) => {
    // Handle single click
    console.log("Single click");
  },
  double: (event) => {
    // Handle double click
    console.log("Double click");
  },
  doubleWait: 300, // Optional: wait time for double click in ms
});
```

## Pointer Events

### Basic Pointer Events

```javascript
input
  .on(element)
  .pointerdown((event) => {
    console.log("Pointer down");
  })
  .pointermove((event) => {
    console.log("Pointer move");
  })
  .pointerup((event) => {
    console.log("Pointer up");
  });
```

### Advanced Pointer Down-Move-Up Gesture

```javascript
input.on(element).pointerDownMoveUp({
  // Called when pointer is pressed down
  onDown: ({ dwn_e, pathContainsMatching } = {}) => {
    // Return false to cancel the gesture
    // Return true to continue
    // Return an object to store data for the gesture
    return {
      startX: dwn_e.clientX,
      startY: dwn_e.clientY,
    };
  },

  // Called when movement starts
  onStartMove: ({ direction, stop } = {}) => {
    const dir = direction();
    // Check movement direction
    if (dir === "left" || dir === "right") {
      return stop(); // Stop the gesture
    }
    return true; // Continue the gesture
  },

  // Called during movement
  onMove: ({ mv_e } = {}, down_return) => {
    // Access stored data from onDown
    console.log("Moving:", mv_e.movementX, mv_e.movementY);
  },

  // Called when pointer is released
  onUp: ({ up_e, dwn_e } = {}, down_return) => {
    // Access stored data from onDown
    console.log("Gesture completed");
  },

  // Optional configuration
  capture: true, // Capture events
  captureMove: true, // Capture move events
  movePrecision: 5, // Movement threshold
  verbose: true, // Enable debug logging
});
```

## Wheel Events

```javascript
input.on(element).wheel({
  onWheel: ({ whl_e, pathContainsMatching } = {}) => {
    // Handle wheel event
    if (whl_e.shiftKey) return false; // Cancel if shift is pressed
    console.log("Wheel delta:", whl_e.deltaY);
  },
  passive: true, // Use passive event listener
});
```

## Right Click Events

```javascript
input.on(element).rightClick({
  onDown: ({ dwn_e } = {}) => {
    // Handle right click down
    console.log("Right click down");
  },
  onUp: ({ r_e } = {}) => {
    // Handle right click up
    console.log("Right click up");
  },
});
```

## Gesture Detection

### Movement Detection

```javascript
input.on(element).move({
  deadzone: 5, // Minimum movement threshold
  onMove: (event) => {
    console.log("Significant movement detected");
  },
});
```

### Direction Detection

```javascript
input.on(element).pointerDownMoveUp({
  onStartMove: ({ direction, stop } = {}) => {
    const dir = direction();
    switch (dir) {
      case "up":
        console.log("Moving up");
        break;
      case "down":
        console.log("Moving down");
        break;
      case "left":
        console.log("Moving left");
        break;
      case "right":
        console.log("Moving right");
        break;
    }
  },
});
```

## Advanced Features

### Event Path Checking

```javascript
input.on(element).pointerDownMoveUp({
  onDown: ({ pathContainsMatching } = {}) => {
    // Check if event path contains specific elements
    if (pathContainsMatching("a,[no-gesture]")) {
      return false; // Cancel gesture
    }
    return true;
  },
});
```

### Movement Context

```javascript
input.on(element).pointerDownMoveUp({
  onMove: ({ distanceFromStart, fourAngleSnap, direction: getDirection, up } = {}) => {
    const direction = getDirection();
    const distance = distanceFromStart();
    const angle = fourAngleSnap();

    // Use movement context for advanced gestures
    if (distance > threshold) {
      up(); // End the gesture
      // Handle gesture completion
    }
  },
});
```

### Gesture State Management

```javascript
input.on(element).pointerDownMoveUp({
  onDown: () => {
    // Initialize gesture state
    return {
      startTime: Date.now(),
      startPosition: { x: 0, y: 0 },
    };
  },
  onMove: (event, state) => {
    // Access and update gesture state
    const duration = Date.now() - state.startTime;
    // Use state for complex gesture logic
  },
});
```

```javascript
alphaDek.input.on(this.feed_index).clickOne({
  onClick: () => this.feed.goTo(0),
});

alphaDek.input.on(this.feed).wheel({
  onWheel: async ({ whl_e, pathContainsMatching } = {}) => {
    // if (pathContainsMatching("a,[no-gesture]")) return false;
    if (whl_e.shiftKey) return false;
    // const direction = whl_e.deltaY > 0 ? "down" : "up";
    // await this.insertTweet(direction);
    this.wheelCtx.culmY += whl_e.deltaY;
    if (Math.abs(this.wheelCtx.culmY) > this.wheelCtx.threshold) {
      if (whl_e.shiftKey) return false;
      const direction = this.wheelCtx.culmY > 0 ? "down" : "up";
      this.wheelCtx.culmY = 0;
      await this.insertTweet(direction);
    }
  },
  passive: true,
});

alphaDek.input.on(this.feed).pointerDownMoveUp({
  onDown: ({ dwn_e, pathContainsMatching } = {}) => {
    if (pathContainsMatching("a,[no-gesture]")) return false;
    return {
      culmY: 0,
      threshold: UNIT.px * 2,
    };
  },
  onStartMove: ({ direction, stop } = {}) => {
    const dir = direction();
    if (dir === "left" || dir === "right") return stop();
    return true;
  },
  onMove: ({ mv_e } = {}, down_return) => {
    down_return.culmY += mv_e.movementY;
    if (Math.abs(down_return.culmY) > down_return.threshold) {
      const _direction = down_return.culmY < 0 ? "down" : "up";
      this.insertTweet(_direction);
      down_return.culmY = 0;
      down_return.actived_once = true;
    }
  },
  onUp: ({ up_e, dwn_e } = {}, { actived_once, culmY } = {}) => {
    if (Math.abs(up_e.clientX - dwn_e.clientX) < 10 && !actived_once) {
      const direction = culmY > 1 ? "up" : culmY < -1 ? "down" : false;
      this.insertTweet(direction);
    }
  },
  capture: true,
  captureMove: true,
  verbose: true,
});

alphaDek.input.on(this.nest_container).pointerDownMoveUp({
  onDown: () => {
    this.nest_container.classList.add("noTransition");
    return true;
  },
  onStartMove: ({ direction, stop } = {}) => {
    console.log("onStartMove");
    const dir = direction();
    if (dir === "left" || dir === "right") return stop();
    return true;
  },
  onMove: ({ distanceFromStart, fourAngleSnap, direction: getDirection, up } = {}) => {
    console.log("onMove");
    const direction = getDirection();
    if (direction === "left" || direction === "right") return false;
    const distance = distanceFromStart();
    this.nest_container.style.transform = angleDistanceToTranslate(fourAngleSnap(), distance);
    if (distance > UNIT.px * 2) {
      up();
      const swap_up_down = direction === "up" ? "down" : "up";
      this.navTweet(swap_up_down);
    }
  },
  onUp: () => {
    this.nest_container.classList.remove("noTransition");
    this.nest_container.style.transform = "";
  },
  capture: true,
  verbose: true,
});

alphaDek.input.on(this.media_area).clickOrTwo({
  single: (se) => {
    const activeImg = this.getActiveImg();
    const x_per = se.clientX / window.innerWidth;
    if (x_per < 0.5 && activeImg.siblingContext.hasPrevSibling) this.focusTo((_) => _ - 1);
    else if (x_per > 0.5 && activeImg.siblingContext.hasNextSibling) this.focusTo((_) => _ + 1);
    else {
      this.visibility(false);
    }
  },
  double: (dbe) => {
    this.getActiveImg().element.panZoom.dblclick(dbe);
  },
  doubleWait: 300,
});

alphaDek.input.on(this.media_area).rightClick({
  onDown: ({ dwn_e } = {}) => {},
  onUp: ({ r_e } = {}) => {
    this.visibility(false);
  },
});

alphaDek.input.on(proxy.remove_tweet).pointerDownMoveUp({
  /*pointerdown*/ onDown: ({ dwn_e } = {}) => {
    ctx.startX = proxy.remove_tweet.getBoundingClientRect().left;
    dwn_e.stopPropagation();
    // dwn_e.stopImmediatePropagation();
    if (offset(dwn_e.layerX) < 0.25) return true;
    proxy.slider.style.setProperty("--offset", 0);
    return false;
  },
  /*pointermove*/ onMove: ({ mv_e } = {}) => {
    if (mv_e.pointerType === "mouse" && mv_e.buttons === 0) return false;
    const xPerOffset = offset(mv_e.clientX - ctx.startX);
    proxy.slider.style.setProperty("--offset", xPerOffset);
    proxy.slider.classList.toggle("active", xPerOffset > 0.7);
    if (xPerOffset > 0.95) {
      alphaDek.deks.__workers__.tweetFeed.quarantineTweet(tweet.nest.id);
    }
  },
  /*pointerup*/ onUp: () => {
    proxy.slider.style.setProperty("--offset", 0);
  },
});

alphaDek.input.on(this.feed).rightClick({
  onUp: ({ dwn_e, composedPath } = {}) => {
    if (composedPath[0] === this.feed) {
      new ContextMenu([new ContextMenuItem("Upload file", "upload", () => console.log("Open upload window"))]).open(
        dwn_e,
        this.feed
      );
    }
  },
});

alphaDek.input.on(this.scroll_scrubber).pointerDownMoveUp({
  onDown: ({ dwn_e } = {}) => {
    if (!this.scrolling) return;
    const percentY = dwn_e.offsetY / this.scroll_scrubber.clientHeight;
    this.feed.scrubToPercent(percentY);
    return {
      parentTop: this.scroll_scrubber.getBoundingClientRect().top,
    };
  },
  onMove: ({ mv_e } = {}, { parentTop }) => {
    const percentY = Math.max(0, (mv_e.clientY - parentTop) / this.scroll_scrubber.clientHeight);
    this.feed.scrubToPercent(percentY);
  },
});

alphaDek.input.on(this.deks_container).pointerDownMoveUp({
  onDown: ({ dwn_e } = {}) => {
    const threshold = UNIT.px * this.sideEdgesUnits;
    if (dwn_e.clientY < threshold) return false;
    const in_gesture_range = dwn_e.clientX < threshold || dwn_e.clientX > window.innerWidth - threshold;
    return (
      in_gesture_range && {
        startX: dwn_e.clientX,
      }
    );
  },
  onStartMove: ({ mv_e, direction, stop } = {}) => {
    const dir = direction();
    if (dir === "left" || dir === "right") {
      const half = mv_e.clientY > window.innerHeight / 2 ? "bottom" : "top";
      if (half === "bottom") {
        this.arena.__switcher__.show();
        return {
          onMove: bottomMove,
          onUp: () => {
            this.arena.__switcher__.hide();
          },
        };
      }
    }
    return stop();
  },
  capture: true,
  movePrecision: 5,
});
```
