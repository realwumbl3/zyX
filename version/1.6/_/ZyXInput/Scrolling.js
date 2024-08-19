// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.

// #endregion
export default function momentumScroll(...args) {
    return new MomentumScroll(this, ...args);
}

export class MomentumScroll {
    constructor(input_binder, container, { scrollTarget, overrideDefaultScroll = false, onPointerMove, onScroll } = {}) {
        // Private variables
        this.container = container

        this.scrollTarget = scrollTarget || container;

        this.velocityY = 0;
        this.animating = false;

        this.pointerDown = false;

        // Private constants
        this.friction = .94; // Friction to simulate momentum

        this.direction = "down";
        this.minVelocityY = 1; // Minimum velocity 
        this.maxVelIncr = 20; // Maximum velocity increment
        this.maxVelocityY = 400; // Maximum velocity

        // Small delta step for small mouse wheel movements like on a trackpad *ahem osx*
        this.smallDeltaStep = {
            floor: 10,
            culm: 0,
            culmLimit: 40,
            tick: 50
        }

        overrideDefaultScroll && this.container.addEventListener('wheel', (e) => {
            if (onScroll && !onScroll(e)) return
            this.wheel(e)
        }, { capture: true, passive: false });

        input_binder.on(this.container).pointerDownMoveUp({
            capture: true,
            captureMove: true,
            onDown: () => {
                this.pointerDown = true;
                const selectionRange = window.getSelection()
                return { selectionRange }
            },
            onStartMove: ({ direction, stop, clearAllSelections } = {}) => {
                const dir = direction()
                if (dir === "left" || dir === "right") return stop();
                clearAllSelections();
                this.container.requestPointerLock();
                return true
            },
            onMove: ({ mv_e, movementY } = {}, { } = {}) => {
                mv_e.stopPropagation();
                mv_e.stopImmediatePropagation();
                if (movementY === 0) return;
                this.container.classList.add("Scrolling")
                onPointerMove && onPointerMove({ mv_e, movementY });
                let intensity = mv_e.shiftKey ? 1 : .5
                mv_e.altKey && (intensity /= 4);
                const velocity_add = movementY * -intensity;
                this.addVelocity(velocity_add);
            },
            onUp: () => {
                this.container.classList.remove("Scrolling")
                document.exitPointerLock();
                this.pointerDown = false;
            }
        });

        this.tick_length = 8;
        this.lastFramePerf = null;
    }

    __animate__() {
        if (this.animating || !(this.animating = true)) return // short circuit if already animating
        requestAnimationFrame(this.__frame__.bind(this));
    }

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

    __frame__() {
        const delta = this.__framedelta__()

        const friction = this.pointerDown ? this.friction * .95 : this.friction;

        this.velocityY *= Math.pow(friction, delta);

        const abs = Math.abs(this.velocityY)

        const effect_delta = this.velocityY * delta

        // console.log("effect_delta", effect_delta, "volocity Y", this.velocityY, { friction, delta, abs })

        this.scrollTarget.scrollTop += effect_delta;

        if (abs < this.minVelocityY) {
            this.lastFramePerf = null;
            this.animating = false;
            return;
        }

        this.animating && requestAnimationFrame(this.__frame__.bind(this));
    }

    checkCounterScroll(e) {
        if (e.deltaY > 0 && this.velocityY < 0 || e.deltaY < 0 && this.velocityY > 0) {
            this.velocityY /= 10;
        }
    }

    resetVelocity() {
        this.velocityY /= 10;
        this.__animate__();
    }

    addVelocity(velocity) {
        if (velocity > 0 && this.velocityY < 0 || velocity < 0 && this.velocityY > 0) {
            this.velocityY /= 10;
        }
        this.velocityY = Math.min(this.velocityY + velocity, this.maxVelocityY);
        this.__animate__();
    }

    wheel(e) {
        e.preventDefault();
        e.stopPropagation();
        this.checkCounterScroll(e);
        this.direction = e.deltaY > 0 ? "down" : "up";
        if (Math.abs(e.deltaY) < this.smallDeltaStep.floor) {
            this.smallDeltaStep.culm += e.deltaY;
            if (Math.abs(this.smallDeltaStep.culm) > this.smallDeltaStep.culmLimit) {
                this.addVelocity(this.smallDeltaStep.tick * this.direction == "down" ? 1 : -1);
                this.smallDeltaStep.sum = 0;
            }
        } else {
            this.addVelocity(e.deltaY * 0.1);
        }
    }

}
