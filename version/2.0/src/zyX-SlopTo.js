/**
 * Smoothly scrolls an HTML container element to a specified position.
 * Handles concurrent scroll requests on the same container by updating the target position
 * of the existing animation.
 *
 * @param {HTMLElement} container - The scrollable container element.
 * @param {object} [options] - Scrolling options.
 * @param {number} [options.top] - The target vertical scroll position.
 * @param {number} [options.left] - The target horizontal scroll position.
 * @returns {Promise<void>} A promise that resolves when the scroll animation completes.
 */
export default async function ScrollTo(container, { top, left } = {}) {
    const any_active = active.has(container);

    if (any_active) {
        const active_animation = active.get(container)
        // Update target scroll position if an existing animation is running
        active_animation.update_target({ top, left })
        // Note: Currently doesn't return a promise for updated animations.
        // Consider returning the existing promise or a new one if needed.
    } else {
        // Initialize a new animation object and associate it with the container.
        const animation = new Animation(container, top, left)
        active.set(container, animation);
        return new Promise((resolve) => {
            animation.onend = resolve
            animation.start()
        });
    }
}

/**
 * @private
 * WeakMap to track active animations per container element.
 */
const active = new WeakMap()

/**
 * @private
 * Manages the state and execution of a scroll animation for a single container.
 */
class Animation {
    /**
     * Creates an Animation instance.
     * @param {HTMLElement} container - The container element to animate.
     * @param {number | undefined} top - The target top scroll position.
     * @param {number | undefined} left - The target left scroll position.
     */
    constructor(container, top, left) {
        this.container = container;
        /** @type {{top: number | undefined, left: number | undefined}} */
        this.target = { top, left }
        /** @type {{startTop: number, startLeft: number}} */
        this.startContext = { startTop: container.scrollTop, startLeft: container.scrollLeft }
        /** @type {number} */
        this.startTime = performance.now()
        /** @type {(() => void) | null} */
        this.onend = null
        /** @type {number} - Duration of the animation in milliseconds. */
        this.duration = 200 // TODO: Make duration configurable
    }


    /**
     * Updates the target scroll position and restarts the animation timer.
     * Called when a new scroll request comes in for a container already animating.
     * @param {object} target - The new target position.
     * @param {number} [target.top] - The new target vertical scroll position.
     * @param {number} [target.left] - The new target horizontal scroll position.
     */
    update_target({ top, left }) {
        if (top !== undefined) this.target.top = top
        if (left !== undefined) this.target.left = left
        // Update start context based on current scroll position
        this.startContext = { startTop: this.container.scrollTop, startLeft: this.container.scrollLeft }
        // Reset start time for the updated animation
        this.startTime = performance.now()
    }

    /**
     * @private
     * Executes a single frame of the animation using requestAnimationFrame.
     * Calculates the eased scroll position based on elapsed time.
     */
    frame() {
        const elapsed = performance.now() - this.startTime
        const { top, left } = this.target
        const { startTop, startLeft } = this.startContext
        const easing = 'easeInOutQuad' // TODO: Make easing function configurable

        // Default to current position if target is undefined
        const targetTop = top ?? this.container.scrollTop;
        const targetLeft = left ?? this.container.scrollLeft;


        if (elapsed < this.duration) {
            // Only scroll if target is defined
            if (top !== undefined) {
                this.container.scrollTop = easingFunctions[easing](elapsed, startTop, targetTop - startTop, this.duration)
            }
             if (left !== undefined) {
                this.container.scrollLeft = easingFunctions[easing](elapsed, startLeft, targetLeft - startLeft, this.duration)
            }
            requestAnimationFrame(this.frame.bind(this))
        } else {
            // Ensure final position is set accurately
             if (top !== undefined) {
                 this.container.scrollTop = targetTop;
             }
            if (left !== undefined) {
                 this.container.scrollLeft = targetLeft;
            }
            active.delete(this.container)
            if (this.onend) {
                this.onend()
            }
        }
    }

    /**
     * Starts the animation loop.
     */
    start() {
        requestAnimationFrame(this.frame.bind(this))
    }

}

/**
 * @private
 * Collection of easing functions.
 * Based on common easing functions (see https://easings.net/).
 * @param {number} t - Current time (elapsed time).
 * @param {number} b - Start value (initial scroll position).
 * @param {number} c - Change in value (target scroll position - initial scroll position).
 * @param {number} d - Duration.
 * @returns {number} The calculated eased value for the current time.
 */
const easingFunctions = {
    /** Ease in and out quadratic easing function. */
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) { return c / 2 * t * t + b; }
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    },
    /** Ease in quadratic easing function. */
    easeInQuad(t, b, c, d) {
        t /= d;
        return c * (t * t) + b;
    },
    /** Ease out quadratic easing function. */
    easeOutQuad(t, b, c, d) {
        t /= d;
        // Corrected original: return -c * (t * t * (t(t - 2)) + 1) + b;
        return -c * t * (t - 2) + b;
    },
    /**
     * Ease bounce function.
     * NOTE: This implementation looks non-standard and may produce unexpected results.
     * Needs review and comparison against standard bounce easing implementations.
     */
     easeBounce(t, b, c, d) {
        t /= d; // Normalize time
        if (t < (1 / 2.75)) {
            return c * (7.5625 * t * t) + b;
        } else if (t < (2 / 2.75)) {
             t -= (1.5 / 2.75);
             return c * (7.5625 * t * t + 0.75) + b;
        } else if (t < (2.5 / 2.75)) {
            t -= (2.25 / 2.75);
            return c * (7.5625 * t * t + 0.9375) + b;
        } else {
            t -= (2.625 / 2.75);
             return c * (7.5625 * t * t + 0.984375) + b;
        }
    }
}
