/**
 * Momentum scrolling module
 * @module ZyXInput/Scrolling
 */

/**
 * Create a new momentum scroll instance
 * @param {ZyXInput} input_binder - The input binder instance
 * @param {Element} container - The scrollable container
 * @param {Object} options - Scroll options
 * @returns {MomentumScroll} The momentum scroll instance
 */
export default function momentumScroll(...args) {
    return new MomentumScroll(this, ...args);
}

/**
 * Momentum scrolling implementation with physics-based animation
 * @class
 */
export class MomentumScroll {
    /**
     * @param {ZyXInput} input_binder - The input binder instance
     * @param {Element} container - The scrollable container
     * @param {Object} options - Scroll options
     * @param {Element} [options.scrollTarget] - Alternative scroll target element
     * @param {boolean} [options.overrideDefaultScroll=false] - Whether to override default scroll behavior
     * @param {Function} [options.onPointerMove] - Callback for pointer move events
     * @param {Function} [options.onWheel] - Callback for scroll events
     */
    constructor(input_binder, container, {
        scrollTarget,
        overrideDefaultScroll = false,
        onPointerMove,
        onWheel,
        onScroll
    } = {}) {
        if (!container) {
            console.warn('[ZyXInput] Invalid container for MomentumScroll');
            return;
        }

        // Initialize container and scroll target
        this.container = container;
        this.scrollTarget = scrollTarget || container;

        // Initialize scroll state
        this.velocityY = 0;
        this.animating = false;
        this.pointerDown = false;
        this.direction = "down";
        this.onScroll = onScroll;

        // Physics constants
        this.friction = 0.94; // Friction coefficient for momentum
        this.minVelocityY = 1; // Minimum velocity threshold
        this.maxVelIncr = 20; // Maximum velocity increment
        this.maxVelocityY = 400; // Maximum velocity cap

        // Trackpad optimization
        this.smallDeltaStep = {
            floor: 10,
            culm: 0,
            culmLimit: 40,
            tick: 50
        };

        // Animation timing
        this.tick_length = 8;
        this.lastFramePerf = null;

        // Set up wheel event handling
        if (overrideDefaultScroll) {
            this.container.addEventListener('wheel', (e) => {
                if (onWheel && !onWheel(e)) return;
                this.wheel(e);
            }, { capture: true, passive: false });
        }

        // Set up pointer events
        this._setupPointerEvents(input_binder, onPointerMove);
    }

    /**
     * Set up pointer event handlers
     * @private
     * @param {ZyXInput} input_binder - The input binder instance
     * @param {Function} onPointerMove - Pointer move callback
     */
    _setupPointerEvents(input_binder, onPointerMove) {
        input_binder.on(this.container).pointerDownMoveUp({
            capture: true,
            captureMove: true,
            onDown: () => {
                this.pointerDown = true;
                const selectionRange = window.getSelection();
                return { selectionRange };
            },
            onStartMove: ({ direction, stop, clearAllSelections } = {}) => {
                const dir = direction();
                if (dir === "left" || dir === "right") return stop();
                clearAllSelections();
                this.container.requestPointerLock();
                return true;
            },
            onMove: ({ mv_e, movementY } = {}) => {
                mv_e.stopPropagation();
                mv_e.stopImmediatePropagation();
                if (movementY === 0) return;

                this.container.classList.add("Scrolling");
                onPointerMove?.({ mv_e, movementY });

                let intensity = mv_e.shiftKey ? 1 : 0.5;
                mv_e.altKey && (intensity /= 4);
                const velocity_add = movementY * -intensity;
                this.addVelocity(velocity_add);
            },
            onUp: () => {
                this.container.classList.remove("Scrolling");
                document.exitPointerLock();
                this.pointerDown = false;
            }
        });
    }

    /**
     * Start the animation loop
     * @private
     */
    __animate__() {
        if (this.animating || !(this.animating = true)) return;
        requestAnimationFrame(this.__frame__.bind(this));
    }

    /**
     * Calculate frame delta time
     * @private
     * @returns {number} The frame delta time
     */
    __framedelta__() {
        const now = performance.now();
        if (this.lastFramePerf === null) {
            this.lastFramePerf = now;
            return 0;
        }
        const delta = now - this.lastFramePerf;
        this.lastFramePerf = now;
        return delta / this.tick_length;
    }

    /**
     * Animation frame handler
     * @private
     */
    __frame__() {
        const frame_delta = this.__framedelta__();
        const friction = this.pointerDown ? this.friction * 0.95 : this.friction;

        // Apply friction to velocity
        this.velocityY *= Math.pow(friction, frame_delta);
        const abs = Math.abs(this.velocityY);
        const delta = this.velocityY * frame_delta;

        // Apply scroll
        this.scrollTarget.scrollTop += delta;
        this.onScroll?.({ deltaY: delta });

        // Stop animation if velocity is below threshold
        if (abs < this.minVelocityY) {
            this.lastFramePerf = null;
            this.animating = false;
            this.onScroll?.({ deltaY: 0 });
            return;
        }

        // Continue animation
        this.animating && requestAnimationFrame(this.__frame__.bind(this));
    }

    /**
     * Check for counter-scrolling and adjust velocity
     * @param {WheelEvent} e - The wheel event
     */
    checkCounterScroll(e) {
        if ((e.deltaY > 0 && this.velocityY < 0) || (e.deltaY < 0 && this.velocityY > 0)) {
            this.velocityY /= 10;
        }
    }

    /**
     * Reset scroll velocity
     */
    resetVelocity() {
        this.velocityY /= 10;
        this.__animate__();
    }

    /**
     * Add velocity to current scroll
     * @param {number} velocity - The velocity to add
     */
    addVelocity(velocity) {
        if ((velocity > 0 && this.velocityY < 0) || (velocity < 0 && this.velocityY > 0)) {
            this.velocityY /= 10;
        }
        this.velocityY = Math.min(this.velocityY + velocity, this.maxVelocityY);
        this.__animate__();
    }

    /**
     * Handle wheel events
     * @param {WheelEvent} e - The wheel event
     */
    wheel(e) {
        e.preventDefault();
        e.stopPropagation();

        this.checkCounterScroll(e);
        this.direction = e.deltaY > 0 ? "down" : "up";

        // Handle small delta movements (trackpad)
        if (Math.abs(e.deltaY) < this.smallDeltaStep.floor) {
            this.smallDeltaStep.culm += e.deltaY;
            if (Math.abs(this.smallDeltaStep.culm) > this.smallDeltaStep.culmLimit) {
                this.addVelocity(this.smallDeltaStep.tick * (this.direction === "down" ? 1 : -1));
                this.smallDeltaStep.culm = 0;
            }
        } else {
            this.addVelocity(e.deltaY * 0.1);
        }
    }
}
