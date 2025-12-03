/**
 * Momentum scrolling module
 * @module ZyXInput/Scrolling
 */

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
     * @param {string} [options.directions] - Directions to scroll, e.g "x" or "y"(Default) or "xy" for both
     * @param {boolean} [options.overrideDefaultScroll=true] - Whether to override default scroll behavior
     * @param {Function} [options.onPointerMove] - Callback for pointer move events
     * @param {Function} [options.onWheel] - Callback for scroll events
     * @param {boolean} [options.swapY] - Swap Y scroll for X scroll, Y scroll events will become X scroll events
     * @param {boolean} [options.swapX] - Swap X scroll for Y scroll, X scroll events will become Y scroll events
     */
    constructor(
        input_binder,
        container,
        {
            scrollTarget,
            directions = "y",
            overrideDefaultScroll = true,
            onPointerMove,
            onWheel,
            onScroll,
            swapY,
            swapX,
        } = {}
    ) {
        if (!container) {
            console.warn("[ZyXInput] Invalid container for MomentumScroll");
            return;
        }

        if (directions === "x") {
            this.directions = { x: true, y: false };
        } else if (directions === "y") {
            this.directions = { x: false, y: true };
        } else {
            this.directions = { x: true, y: true };
        }

        // Initialize container and scroll target
        this.container = container;
        this.scrollTarget = scrollTarget || container;
        this.container._momentumScroll = this; // Mark container as having momentum scroll
        this.swapY = swapY;
        this.swapX = swapX;

        // Initialize scroll state
        this.velocityY = 0;
        this.animating = false;
        this.pointerDown = false;
        this.direction = "down";
        this.onScroll = onScroll;

        // Initialize horizontal scroll state (new)
        this.velocityX = 0;

        // Physics constants
        this.friction = 0.94; // Friction coefficient for momentum
        this.minVelocityY = 1; // Minimum velocity threshold
        this.maxVelIncr = 20; // Maximum velocity increment
        this.maxVelocityY = 400; // Maximum velocity cap
        // Add horizontal physics constants (new)
        this.minVelocityX = 1;
        this.maxVelocityX = 400;

        // Trackpad optimization (vertical)
        this.smallDeltaStep = {
            floor: 10,
            culm: 0,
            culmLimit: 10,
            tick: 10,
        };

        // Add horizontal trackpad optimization (new)
        this.smallDeltaStepX = {
            floor: 10,
            culm: 0,
            culmLimit: 20,
            tick: 20,
        };

        // Animation timing
        this.tick_length = 8;
        this.lastFramePerf = null;

        // Set up wheel event handling
        if (overrideDefaultScroll) {
            this.container.addEventListener(
                "wheel",
                (e) => {
                    if (onWheel && !onWheel(e)) return;
                    this.wheel(e);
                },
                { capture: true, passive: false }
            );
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
            onDown: ({ dwn_e }) => {
                // Check if any child element has momentum scrolling enabled
                const check = this._checkPathForMomentumScroll(dwn_e);
                if (check) return false;
                this.pointerDown = true;
                return true;
            },
            onStartMove: ({ direction, stop, clearAllSelections } = {}) => {
                const dir = direction();
                const isVertical = dir === "up" || dir === "down";
                const isHorizontal = dir === "left" || dir === "right";

                // Stop if the drag direction corresponds to a disabled scroll direction.
                if ((isVertical && !this.directions.y) || (isHorizontal && !this.directions.x)) {
                    return stop();
                }

                // If the move is allowed, proceed with setup.
                // Clear selections and request pointer lock *only if vertical scroll is enabled*.
                if (this.directions.y) {
                    clearAllSelections();
                    this.container.requestPointerLock();
                }
                return true; // Allow move to start
            },
            onMove: ({ mv_e, movementY, movementX } = {}) => {
                mv_e.stopPropagation();
                mv_e.stopImmediatePropagation();
                // Ignore if no movement relevant to enabled directions
                if (this.directions.y && movementY === 0 && this.directions.x && movementX === 0) return;

                this.container.classList.add("Scrolling");
                onPointerMove?.({ mv_e, movementY, movementX });

                let intensity = mv_e.shiftKey ? 1 : 0.5;
                mv_e.altKey && (intensity /= 4);

                // Add velocity based on enabled directions
                if (this.directions.y) {
                    const velocity_add_y = movementY * -intensity;
                    this.addVelocity(0, velocity_add_y);
                }
                if (this.directions.x) {
                    const velocity_add_x = movementX * -intensity;
                    this.addVelocity(velocity_add_x, 0);
                }
            },
            onUp: () => {
                this.container.classList.remove("Scrolling");
                document.exitPointerLock();
                this.pointerDown = false;
            },
        });
    }

    /**
     * Check if any child element has momentum scrolling enabled
     * @param {Event} e - The event
     * @returns {boolean} True if any child element has momentum scrolling enabled
     */
    _checkPathForMomentumScroll(e) {
        const eventPath = e.composedPath();
        for (let i = 0; i < eventPath.length; i++) {
            const element = eventPath[i];
            if (element === this.container) break; // Stop at current container
            if (element._momentumScroll) {
                return true; // Prevent event if child has momentum scroll
            }
        }
        return false;
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
        if (frame_delta === 0) {
            this.animating && requestAnimationFrame(this.__frame__.bind(this));
            return; // Skip frame if delta is 0
        }
        const friction = this.pointerDown ? this.friction * 0.95 : this.friction;
        const friction_pow = Math.pow(friction, frame_delta);

        let deltaX = 0;
        let deltaY = 0;
        let absX = 0;
        let absY = 0;

        // Apply friction and calculate delta for Y if enabled
        if (this.directions.y) {
            this.velocityY *= friction_pow;
            absY = Math.abs(this.velocityY);
            deltaY = this.velocityY * frame_delta;
            this.scrollTarget.scrollTop += deltaY;
        }

        // Apply friction and calculate delta for X if enabled
        if (this.directions.x) {
            this.velocityX *= friction_pow;
            absX = Math.abs(this.velocityX);
            deltaX = this.velocityX * frame_delta;
            this.scrollTarget.scrollLeft += deltaX;
        }

        // Apply scroll and notify
        this.onScroll?.({ deltaX, deltaY });

        // Stop animation if velocity is below threshold in enabled directions
        const stopY = !this.directions.y || absY < this.minVelocityY;
        const stopX = !this.directions.x || absX < this.minVelocityX;

        if (stopX && stopY) {
            this.lastFramePerf = null;
            this.animating = false;
            this.onScroll?.({ deltaX: 0, deltaY: 0 }); // Notify final state
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
        // Check Y direction
        if (this.directions.y && ((e.deltaY > 0 && this.velocityY < 0) || (e.deltaY < 0 && this.velocityY > 0))) {
            this.velocityY /= 10;
        }
        // Check X direction
        if (this.directions.x && ((e.deltaX > 0 && this.velocityX < 0) || (e.deltaX < 0 && this.velocityX > 0))) {
            this.velocityX /= 10;
        }
    }

    /**
     * Reset scroll velocity
     */
    resetVelocity() {
        if (this.directions.y) this.velocityY /= 10;
        if (this.directions.x) this.velocityX /= 10;
        this.__animate__();
    }

    /**
     * Slow stop the animation, gradually reducing velocity to 0
     */
    slowStop() {
        console.log("> slowStop", this.velocityY, this.velocityX);
        this.velocityY /= 4;
        this.velocityX /= 4;
        console.log("slowStop >", this.velocityY, this.velocityX);
        // this.__animate__();
    }

    /**
     * Add velocity to current scroll
     * @param {number} velocityX - The horizontal velocity to add
     * @param {number} velocityY - The vertical velocity to add
     */
    addVelocity(velocityX = 0, velocityY = 0) {
        // Handle Y direction
        if (this.directions.y && velocityY !== 0) {
            if ((velocityY > 0 && this.velocityY < 0) || (velocityY < 0 && this.velocityY > 0)) {
                this.velocityY /= 10; // Dampen counter-scroll
            }
            this.velocityY = Math.max(-this.maxVelocityY, Math.min(this.velocityY + velocityY, this.maxVelocityY));
        }

        // Handle X direction
        if (this.directions.x && velocityX !== 0) {
            if ((velocityX > 0 && this.velocityX < 0) || (velocityX < 0 && this.velocityX > 0)) {
                this.velocityX /= 10; // Dampen counter-scroll
            }
            this.velocityX = Math.max(-this.maxVelocityX, Math.min(this.velocityX + velocityX, this.maxVelocityX));
        }

        this.__animate__();
    }

    /**
     * Handle wheel events
     * @param {WheelEvent} e - The wheel event
     */
    wheel(e) {
        const check = this._checkPathForMomentumScroll(e);
        if (check) return;

        e.preventDefault();
        e.stopPropagation();

        this.checkCounterScroll(e);

        let deltaX = e.deltaX;
        let deltaY = e.deltaY;

        if (this.swapY) {
            deltaX = e.deltaY;
        }
        if (this.swapX) {
            deltaY = e.deltaX;
        }

        this.direction = deltaY > 0 ? "down" : "up";

        let addVelX = 0;
        let addVelY = 0;

        // Handle Y delta if enabled
        if (this.directions.y && deltaY !== 0) {
            if (Math.abs(deltaY) < this.smallDeltaStep.floor) {
                this.smallDeltaStep.culm += deltaY;
                if (Math.abs(this.smallDeltaStep.culm) > this.smallDeltaStep.culmLimit) {
                    addVelY = this.smallDeltaStep.tick * (deltaY > 0 ? 1 : -1);
                    this.smallDeltaStep.culm = 0;
                }
            } else {
                addVelY = deltaY * 0.1;
                this.smallDeltaStep.culm = 0; // Reset accumulator on large step
            }
        } else {
            this.smallDeltaStep.culm = 0; // Reset if Y scrolling is disabled or deltaY is 0
        }

        // Handle X delta if enabled
        if (this.directions.x && deltaX !== 0) {
            if (Math.abs(deltaX) < this.smallDeltaStepX.floor) {
                this.smallDeltaStepX.culm += deltaX;
                if (Math.abs(this.smallDeltaStepX.culm) > this.smallDeltaStepX.culmLimit) {
                    addVelX = this.smallDeltaStepX.tick * (deltaX > 0 ? 1 : -1);
                    this.smallDeltaStepX.culm = 0;
                }
            } else {
                addVelX = deltaX * 0.1;
                this.smallDeltaStepX.culm = 0; // Reset accumulator on large step
            }
        } else {
            this.smallDeltaStepX.culm = 0; // Reset if X scrolling is disabled or deltaX is 0
        }

        // Add calculated velocities
        if (addVelX !== 0 || addVelY !== 0) {
            this.addVelocity(addVelX, addVelY);
        }
    }
}
